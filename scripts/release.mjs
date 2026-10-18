import {validateSource,buildSite,verifyDistribution} from './site-lib.mjs';
try{
 const {files}=validateSource();
 console.log('Source checks passed.');
 buildSite(files);
 console.log('Built dist from the explicit public file list.');
 verifyDistribution(files);
 console.log(`Distribution checks passed (${files.length} files; developer tools excluded).`);
}catch(error){console.error('Release check failed: '+error.message);process.exitCode=1;}