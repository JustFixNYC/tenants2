import * as fs from 'fs';
import * as path from 'path';

import { GraphQLSchema, GraphQLObjectType, GraphQLType, isNonNullType, isListType, isObjectType, GraphQLField } from "graphql";
import { ToolError, writeFileIfChangedSync, reportChanged} from "./util";
import { GraphQlFile } from "./graphql-file";
import { AUTOGEN_PREAMBLE, AUTOGEN_CONFIG_PATH, QUERIES_PATH } from "./config";

type LatestVersion = 1;

const LATEST_VERSION: LatestVersion = 1;

type AutogenConfig = {
  version: LatestVersion,
  fragments: { [name: string]: string },
  ignoreFields: string[]
};

function getWrappedType(type: GraphQLType): GraphQLType|null {
  if (isNonNullType(type)) {
    return type.ofType;
  }
  if (isListType(type)) {
    return type.ofType;
  }
  return null;
}

function fullyUnwrapType(type: GraphQLType): GraphQLType {
  while (true) {
    let wrappedType = getWrappedType(type);
    if (wrappedType === null) return type;
    type = wrappedType;
  }
}

type BuildQueryContext = {
  indent: string;
  fragmentMap: Map<string, string>;
  ignoreFields: Set<string>
};

function getQueryField(field: GraphQLField<any, any>, ctx: BuildQueryContext): string {
  const type = fullyUnwrapType(field.type);
  if (isObjectType(type)) {
    const fragmentName = ctx.fragmentMap.get(type.name);
    if (fragmentName) {
      return `${ctx.indent}${field.name} { ...${fragmentName} }`;
    } else {
      const subquery = getQueryForType(type, {
        ...ctx,
        indent: ctx.indent + '  ',
      });
      return `${ctx.indent}${field.name} {\n${subquery}\n${ctx.indent}}`;
    }
  } else {
    return `${ctx.indent}${field.name}`;
  }
}

function getQueryForType(type: GraphQLObjectType, ctx: BuildQueryContext): string {
  const fields = type.getFields();
  const queryKeys: string[] = [];
  for (let field of Object.values(fields)) {
    if (ctx.ignoreFields.has(field.name)) continue;
    queryKeys.push(getQueryField(field, ctx));
  }
  return queryKeys.join(',\n');
}

type OutputFile = {
  filename: string,
  contents: string
};

function autogenerateGraphql(config: AutogenConfig, schema: GraphQLSchema): OutputFile[] {
  if (config.version !== LATEST_VERSION) {
    throw new ToolError(
      `Please restart this tool, configuration schema has changed ` +
      `from ${LATEST_VERSION} to ${config.version}`
    );
  }

  const fragmentMap = new Map(Object.entries(config.fragments));
  const ignoreFields = new Set(config.ignoreFields);
  const output = [];

  for (let entry of fragmentMap.entries()) {
    const [typeName, fragmentName] = entry;

    const filename = `${fragmentName}.graphql`;
    const type = schema.getType(typeName);

    if (!type || !isObjectType(type)) {
      throw new ToolError(`"${typeName}" is not a valid GraphQL object type.`);
    }

    const queryBody = getQueryForType(type, {
      indent: '  ',
      fragmentMap,
      ignoreFields
    });
    const contents = `fragment ${fragmentName} on ${typeName} {\n${queryBody}\n}`;

    output.push({ filename, contents });
  }

  return output;
}

/**
 * Delete any stale GraphQL files if needed, given a list of GraphQL files
 * we know are fresh.
 */
function deleteStaleGraphQlFiles(freshFiles: Set<string>, graphQlFiles = GraphQlFile.fromDir()) {
  const filesRemoved: string[] = [];
  graphQlFiles = graphQlFiles.filter(file => {
    if (file.graphQl.startsWith(AUTOGEN_PREAMBLE) && !freshFiles.has(file.graphQlFilename)) {
      // This is a stale auto-generated file, remove it.
      filesRemoved.push(file.graphQlFilename);
      fs.unlinkSync(file.graphQlPath);
      return false;
    }
    return true;
  });

  return { filesRemoved, graphQlFiles };
}

/**
 * Autogenerate GraphQL files against the given schema, deleting any stale
 * auto-generated GraphQL files if needed.
 */
export function autogenerateGraphQlFiles(schema: GraphQLSchema): {
  graphQlFiles: GraphQlFile[],
  filesChanged: string[]
} {
  const autogenConfig = JSON.parse(fs.readFileSync(AUTOGEN_CONFIG_PATH, { encoding: 'utf-8' }));
  const output = autogenerateGraphql(autogenConfig, schema);
  const freshFiles = new Set<string>();
  const filesGenerated: string[] = [];

  output.forEach(({ filename, contents }) => {
    freshFiles.add(filename);
    if (writeFileIfChangedSync(path.join(QUERIES_PATH, filename), `${AUTOGEN_PREAMBLE}${contents}`)) {
      filesGenerated.push(filename);
    }
  });

  const { graphQlFiles, filesRemoved } = deleteStaleGraphQlFiles(freshFiles);

  reportChanged(filesGenerated, (number, s) => 
    `Generated ${number} GraphQL query file${s} in ${QUERIES_PATH}.`);

  reportChanged(filesRemoved, (number, s) =>
    `Deleted ${number} stale GraphQL query file${s} from ${QUERIES_PATH}.`);

  return {
    graphQlFiles,
    filesChanged: [...filesGenerated, ...filesRemoved].map(f => path.join(QUERIES_PATH, f))
  };
}
