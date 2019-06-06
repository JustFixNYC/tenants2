import * as fs from 'fs';
import * as path from 'path';

import { GraphQLSchema, GraphQLObjectType, isObjectType, GraphQLField } from "graphql";
import { writeFileIfChangedSync, reportChanged} from "../util";
import { GraphQlFile } from "../graphql-file";
import { AUTOGEN_PREAMBLE, AUTOGEN_CONFIG_PATH, QUERIES_PATH } from "../config";
import { fullyUnwrapType } from './graphql-schema-util';
import { AutogenContext, loadAutogenConfig } from './config';

/**
 * Return a GraphQL query for just the given field and any sub-fields in it.
 */
function getQueryField(field: GraphQLField<any, any>, indent: string, ctx: AutogenContext): string {
  const type = fullyUnwrapType(field.type);
  if (isObjectType(type)) {
    const fragmentName = ctx.getFragmentName(type);
    if (fragmentName) {
      return `${indent}${field.name} { ...${fragmentName} }`;
    } else {
      const subquery = getQueryForType(type, indent + '  ', ctx);
      return `${indent}${field.name} {\n${subquery}\n${indent}}`;
    }
  } else {
    return `${indent}${field.name}`;
  }
}

/**
 * Return a GraphQL query body for all fields in the given type in the schema.
 */
function getQueryForType(type: GraphQLObjectType, indent: string, ctx: AutogenContext): string {
  const fields = type.getFields();
  const queryKeys: string[] = [];
  for (let field of Object.values(fields)) {
    if (!ctx.shouldIgnoreField(type, field)) {
      queryKeys.push(getQueryField(field, indent, ctx));
    }
  }
  return queryKeys.join(',\n');
}

type OutputFile = {
  filename: string,
  contents: string
};

/**
 * Auto-generate GraphQL fragments.
 */
function *generateFragments(ctx: AutogenContext): IterableIterator<OutputFile> {
  for (let typeInfo of ctx.iterFragmentTypes()) {
    const { type, fragmentName } = typeInfo;
    const filename = `${fragmentName}.graphql`;
    const queryBody = getQueryForType(type, '  ', ctx);
    const contents = `fragment ${fragmentName} on ${type.name} {\n${queryBody}\n}`;
    yield { filename, contents };
  }
}

/**
 * Delete any stale GraphQL files if needed, given a list of GraphQL files
 * we know are fresh.
 */
function deleteStaleGraphQlFiles(
  freshFiles: Set<string>,
  dryRun: boolean,
  graphQlFiles = GraphQlFile.fromDir()
) {
  const filesRemoved: string[] = [];
  graphQlFiles = graphQlFiles.filter(file => {
    if (file.graphQl.startsWith(AUTOGEN_PREAMBLE) && !freshFiles.has(file.graphQlFilename)) {
      // This is a stale auto-generated file, remove it.
      filesRemoved.push(file.graphQlFilename);
      if (!dryRun) {
        fs.unlinkSync(file.graphQlPath);
      }
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
export function autogenerateGraphQlFiles(schema: GraphQLSchema, dryRun: boolean = false): {
  graphQlFiles: GraphQlFile[],
  filesChanged: string[]
} {
  const ctx = new AutogenContext(loadAutogenConfig(AUTOGEN_CONFIG_PATH), schema);
  const output = [...generateFragments(ctx)];
  const freshFiles = new Set<string>();
  const filesGenerated: string[] = [];

  output.forEach(({ filename, contents }) => {
    freshFiles.add(filename);
    const fullPath = path.join(QUERIES_PATH, filename);
    if (writeFileIfChangedSync(fullPath, `${AUTOGEN_PREAMBLE}${contents}`, dryRun)) {
      filesGenerated.push(filename);
    }
  });

  const { graphQlFiles, filesRemoved } = deleteStaleGraphQlFiles(freshFiles, dryRun);

  reportChanged(filesGenerated, (number, s) => 
    `Generated ${number} GraphQL query file${s} in ${QUERIES_PATH}.`);

  reportChanged(filesRemoved, (number, s) =>
    `Deleted ${number} stale GraphQL query file${s} from ${QUERIES_PATH}.`);

  return {
    graphQlFiles,
    filesChanged: [...filesGenerated, ...filesRemoved].map(f => path.join(QUERIES_PATH, f))
  };
}
