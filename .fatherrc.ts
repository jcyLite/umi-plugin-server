export default [{
  target: 'esnext',
  cjs: { type: 'babel', lazy: true },
  disableTypeCheck: true,
  extraBabelPlugins: [
    [
      'babel-plugin-import',
      { libraryName: 'antd', libraryDirectory: 'es', style: true },
      'antd',
    ],
  ],
}];
