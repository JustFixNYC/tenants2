//@ts-nocheck

require('@babel/register')({
  ...require('./base').nodeBabelOptions,
  extensions: ['.ts']
});
