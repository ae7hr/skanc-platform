import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPair,exportJWK,createLocalJWKSet,SignJWT,UnsecuredJWT,type JWTPayload} from 'jose';
import {AuthenticationError,verifyFirebaseToken} from './firebase-token.ts';

const project='skanc-test';
const pair=await generateKeyPair('RS256');
const jwk=await exportJWK(pair.publicKey);
const keys=createLocalJWKSet({keys:[{...jwk,kid:'test',alg:'RS256',use:'sig'}]});
function claims():JWTPayload {
 const now=Math.floor(Date.now()/1000);
 return {iss:`https://securetoken.google.com/${project}`,aud:project,sub:'test-user',iat:now,exp:now+3600,auth_time:now,email:'Admin@Example.test',email_verified:true,name:'Test Admin'};
}
async function token(overrides:JWTPayload={}){
 return new SignJWT({...claims(),...overrides}).setProtectedHeader({alg:'RS256',kid:'test'}).sign(pair.privateKey);
}
test('Firebase identity requires a valid signature and normalizes email',async()=>{
 assert.deepEqual(await verifyFirebaseToken(await token(),project,keys),{userId:'test-user',email:'admin@example.test',displayName:'Test Admin'});
});
test('tokens from another project, issuer or signing key are rejected',async()=>{
 for(const overrides of [{aud:'other-project'},{iss:'https://attacker.example'},{sub:''}]){
  await assert.rejects(verifyFirebaseToken(await token(overrides),project,keys),AuthenticationError);
 }
 const other=await generateKeyPair('RS256');
 const forged=await new SignJWT(claims()).setProtectedHeader({alg:'RS256',kid:'test'}).sign(other.privateKey);
 await assert.rejects(verifyFirebaseToken(forged,project,keys),AuthenticationError);
 await assert.rejects(verifyFirebaseToken(new UnsecuredJWT(claims()).encode(),project,keys),AuthenticationError);
});
test('expired tokens and future authentication are rejected',async()=>{
 const now=Math.floor(Date.now()/1000);
 for(const overrides of [{exp:now-60},{iat:now+60},{auth_time:now+60},{iat:now-4000,exp:now+500}]){
  await assert.rejects(verifyFirebaseToken(await token(overrides),project,keys),AuthenticationError);
 }
});
test('unverified, missing and malformed email claims cannot access records',async()=>{
 await assert.rejects(verifyFirebaseToken(await token({email_verified:false}),project,keys),(error:unknown)=>error instanceof AuthenticationError&&error.status===403);
 for(const overrides of [{email:''},{email:undefined},{email_verified:undefined},{auth_time:undefined},{exp:undefined}]){
  await assert.rejects(verifyFirebaseToken(await token(overrides),project,keys),AuthenticationError);
 }
 await assert.rejects(verifyFirebaseToken('',project,keys),AuthenticationError);
 await assert.rejects(verifyFirebaseToken('x'.repeat(8193),project,keys),AuthenticationError);
});
