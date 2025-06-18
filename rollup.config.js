import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dtsPlugin from 'rollup-plugin-dts'; // 修正为 named import 或改用默认名称
// import dts from 'rollup-plugin-dts';

const dts = ('default' in dtsPlugin) ? dtsPlugin.default : dtsPlugin;

export default [
  // 主构建
  {
    input: 'src/index.ts',
    output: [
      { file: 'dist/index.cjs.js', format: 'cjs', exports: 'auto' }, // 明确导出模式
      { file: 'dist/index.esm.js', format: 'esm' },
    ],
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
    ],
    external: ['react', 'react-dom'], // 强制排除React
  },
  // 类型声明构建
  {
    input: 'src/index.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [dts()],
  },
];