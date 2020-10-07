import * as fs from "fs";
import * as path from "path";

import {
  GraphQLObjectType,
  isObjectType,
  GraphQLField,
  GraphQLInputObjectType,
  GraphQLNamedType,
} from "graphql";
import { writeFileIfChangedSync, reportChanged, ToolError } from "../util";
import { GraphQlFile, ExtraTsCodeInfo } from "../graphql-file";
import { AUTOGEN_PREAMBLE, AUTOGEN_QUERIES_PATH } from "../config";
import {
  fullyUnwrapType,
  ensureObjectType,
  findContainedInputObjectTypes,
} from "./graphql-schema-util";
import { AutogenContext } from "./context";
import {
  createBlankTypeLiteral,
  CreateBlankTypeLiteralOptions,
} from "./blank-type-literals";

/**
 * Return a GraphQL query for just the given field and any sub-fields in it.
 */
function getQueryField(
  field: GraphQLField<any, any>,
  indent: string,
  ctx: AutogenContext
): string {
  const type = fullyUnwrapType(field.type);
  if (isObjectType(type)) {
    const fragmentName = ctx.getFragmentName(type);
    if (fragmentName) {
      return `${indent}${field.name} { ...${fragmentName} }`;
    } else {
      const subquery = getQueryForType(type, indent + "  ", ctx);
      return `${indent}${field.name} {\n${subquery}\n${indent}}`;
    }
  } else {
    return `${indent}${field.name}`;
  }
}

/**
 * Return a GraphQL query body for all fields in the given type in the schema.
 */
function getQueryForType(
  type: GraphQLObjectType,
  indent: string,
  ctx: AutogenContext
): string {
  const fields = type.getFields();
  const queryKeys: string[] = [];
  for (let field of Object.values(fields)) {
    if (!ctx.shouldIgnoreField(type, field)) {
      queryKeys.push(getQueryField(field, indent, ctx));
    }
  }
  return queryKeys.join(",\n");
}

type OutputFile = {
  filename: string;
  contents: string;
};

function filenameForFragment(fragmentName: string): string {
  return `${fragmentName}.graphql`;
}

/**
 * Auto-generate GraphQL fragments.
 */
function* generateFragments(ctx: AutogenContext): IterableIterator<OutputFile> {
  for (let typeInfo of ctx.iterFragmentTypes()) {
    const { type, fragmentName } = typeInfo;
    const filename = filenameForFragment(fragmentName);
    const queryBody = getQueryForType(type, "  ", ctx);
    const contents = `fragment ${fragmentName} on ${type.name} {\n${queryBody}\n}`;
    yield { filename, contents };
  }
}

function* generateMutations(ctx: AutogenContext): IterableIterator<OutputFile> {
  for (let mutInfo of ctx.mutationMap.values()) {
    const {
      name,
      filename,
      fieldName,
      inputArg,
      outputType,
      sessionFields,
    } = mutInfo;
    let queryCtx = sessionFields
      ? ctx.withModifiedTypes({
          SessionInfo: { includeOnlyFields: sessionFields },
        })
      : ctx;
    const contents = [
      `mutation ${name}($input: ${inputArg.type}) {`,
      `  output: ${fieldName}(${inputArg.name}: $input) {`,
      getQueryForType(outputType, "    ", queryCtx),
      `  }`,
      `}`,
    ].join("\n");
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
  graphQlFiles = graphQlFiles.filter((file) => {
    if (
      file.graphQl.startsWith(AUTOGEN_PREAMBLE) &&
      !freshFiles.has(file.graphQlFilename)
    ) {
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
export function autogenerateGraphQlFiles(
  ctx: AutogenContext,
  dryRun: boolean = false
): {
  graphQlFiles: GraphQlFile[];
  filesChanged: string[];
} {
  const output = [...generateFragments(ctx), ...generateMutations(ctx)];
  const freshFiles = new Set<string>();
  const filesGenerated: string[] = [];

  output.forEach(({ filename, contents }) => {
    freshFiles.add(filename);
    const fullPath = path.join(AUTOGEN_QUERIES_PATH, filename);
    if (
      writeFileIfChangedSync(fullPath, `${AUTOGEN_PREAMBLE}${contents}`, dryRun)
    ) {
      filesGenerated.push(filename);
    }
  });

  const { graphQlFiles, filesRemoved } = deleteStaleGraphQlFiles(
    freshFiles,
    dryRun
  );

  reportChanged(
    filesGenerated,
    (number, s) =>
      `Generated ${number} GraphQL query file${s} in ${AUTOGEN_QUERIES_PATH}.`
  );

  reportChanged(
    filesRemoved,
    (number, s) =>
      `Deleted ${number} stale GraphQL query file${s} from ${AUTOGEN_QUERIES_PATH}.`
  );

  return {
    graphQlFiles,
    filesChanged: [...filesGenerated, ...filesRemoved].map((f) =>
      path.join(AUTOGEN_QUERIES_PATH, f)
    ),
  };
}

const blankName = (typeName: string) => `Blank${typeName}`;

function generateBlankTypeLiteral(
  type: GraphQLObjectType | GraphQLInputObjectType,
  typeName: string,
  options?: CreateBlankTypeLiteralOptions
): string {
  const blankLiteral = createBlankTypeLiteral(type, options);
  const exportedName = blankName(typeName);
  const tsCode = `export const ${exportedName}: ${typeName} = ${blankLiteral};\n`;
  return tsCode;
}

function ensureFragmentName(
  ctx: AutogenContext,
  type: GraphQLNamedType
): string {
  const fragmentName = ctx.getFragmentName(type);
  if (!fragmentName) {
    throw new ToolError(
      `Blank object literals are only currently supported on fragments, ` +
        `which the type "${type.name}" does not have.`
    );
  }
  return fragmentName;
}

function* generateBlankTypeLiteralsForFragments(
  ctx: AutogenContext
): IterableIterator<[string, ExtraTsCodeInfo]> {
  for (let info of ctx.typeMap.values()) {
    if (info.createBlankLiteral) {
      const fragmentName = ensureFragmentName(ctx, info.type);
      yield [
        filenameForFragment(fragmentName),
        {
          code: generateBlankTypeLiteral(
            ensureObjectType(info.type),
            fragmentName,
            { shouldIgnoreField: ctx.shouldIgnoreField.bind(ctx) }
          ),
        },
      ];
    }
  }
}

function generateBlankTypeLiteralForInput(
  inputObjectType: GraphQLInputObjectType
): string {
  return generateBlankTypeLiteral(inputObjectType, inputObjectType.name, {
    excludeNullableFields: true,
  });
}

/**
 * Auto-generate blank type literals for anything that needs it. Return a
 * mapping from GraphQL filenames to TypeScript code defining the literals.
 */
export function generateBlankTypeLiterals(
  ctx: AutogenContext
): Map<string, ExtraTsCodeInfo> {
  let fileMap = new Map<string, ExtraTsCodeInfo>();

  for (let entry of generateBlankTypeLiteralsForFragments(ctx)) {
    fileMap.set(...entry);
  }

  for (let { filename, inputObjectType } of ctx.mutationMap.values()) {
    const extraInputTypes = findContainedInputObjectTypes(inputObjectType);
    const codeSnippets = [
      generateBlankTypeLiteralForInput(inputObjectType),
      ...extraInputTypes.map(generateBlankTypeLiteralForInput),
    ];
    const codeInfo: ExtraTsCodeInfo = {
      extraGlobalTypesImports: extraInputTypes.map((type) => type.name),
      extraObjectProperties: [["blankInput", blankName(inputObjectType.name)]],
      code: codeSnippets.join("\n\n"),
    };
    fileMap.set(filename, codeInfo);
  }

  return fileMap;
}
