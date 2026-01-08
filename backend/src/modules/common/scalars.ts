import { GraphQLScalarType, Kind } from 'graphql';

export const JSONScalar = new GraphQLScalarType({
    name: 'JSON',
    description: 'Arbitrary JSON value',
    parseValue: (v: any) => v,
    serialize: (v: any) => v,
    parseLiteral(ast: any) {
        switch (ast.kind) {
            case Kind.STRING:
            case Kind.BOOLEAN:
            case Kind.INT:
            case Kind.FLOAT:
                return ast.value as any;
            case Kind.OBJECT:
            case Kind.LIST:
                return (ast as any).value;
            default:
                return null;
        }
    }
});

export const DateTimeScalar = new GraphQLScalarType({
    name: 'DateTime',
    description: 'DateTime scalar type',
    parseValue: (v: any) => {
        if (v instanceof Date) return v;
        if (typeof v === 'string' || typeof v === 'number') return new Date(v);
        return null;
    },
    serialize: (v: any) => {
        if (v instanceof Date) return v.toISOString();
        if (typeof v === 'string') return v;
        return null;
    },
    parseLiteral(ast: any) {
        if (ast.kind === Kind.STRING || ast.kind === Kind.INT) {
            return new Date(ast.value);
        }
        return null;
    }
});

// Use GraphQLUpload from graphql-upload for proper file upload handling
export { default as UploadScalar } from 'graphql-upload/GraphQLUpload.mjs';
