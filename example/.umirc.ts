import { defineConfig } from 'umi';

export default defineConfig({
  plugins: [require.resolve('../lib')],
  server: {
    port: 4000,
  },
  proxy:{
    '/api':{
      target:'http://localhost:4000' ,
      changeOrigin:true
    }
  }
});
