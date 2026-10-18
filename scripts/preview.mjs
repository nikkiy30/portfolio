import {createPreviewServer} from './site-lib.mjs';
try{
 const developer=process.argv.includes('--developer');
 const port=developer?4174:4173;
 const server=createPreviewServer({developer});
 server.on('error',()=>{console.error('Preview could not start. Check whether its port is already in use.');process.exitCode=1;});
 server.listen(port,'127.0.0.1',()=>console.log(`${developer?'Local developer tools':'Public distribution preview'}: http://127.0.0.1:${port}/${developer?'developer-admin.html':''}`));
}catch(error){console.error('Preview unavailable: '+error.message);process.exitCode=1;}