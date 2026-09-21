import './integration-loader.mjs';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
process.env.SUPABASE_URL='https://fixture.supabase.invalid';
process.env.SUPABASE_JWT_SECRET=randomUUID()+randomUUID();
process.env.AUTH_JWT_SECRET=randomUUID()+randomUUID();
const {SignJWT}=await import('jose');
const {verifySupabaseAccessToken}=await import('../../../../lib/server/supabase-jwt.ts');
const {signAppAccessToken,verifyAppAccessToken}=await import('../../../../lib/server/app-jwt.ts');
const key=new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET);
async function token(issuer='https://fixture.supabase.invalid/auth/v1',audience='authenticated',expiry='1h') {
 return new SignJWT({}).setProtectedHeader({alg:'HS256'}).setSubject('fixture-user').setIssuer(issuer).setAudience(audience).setExpirationTime(expiry).sign(key);
}
assert.equal(await verifySupabaseAccessToken(await token()),'fixture-user');
assert.equal(await verifySupabaseAccessToken(await token('wrong-issuer')),null);
assert.equal(await verifySupabaseAccessToken(await token(undefined,'anon')),null);
assert.equal(await verifySupabaseAccessToken(await token(undefined,undefined,'-1h')),null);
assert.equal(await verifySupabaseAccessToken('not-a-token'),null);
const appToken=await signAppAccessToken('app-fixture');
assert.equal(await verifyAppAccessToken(appToken),'app-fixture');
assert.equal(await verifySupabaseAccessToken(appToken),null);
assert.equal(await verifyAppAccessToken(await token()),null);
console.log('PASS 8 JWT assertions: trusted issuer/audience, expiry, malformed token, and separation of app/Supabase credentials. HS256 fixtures only; remote JWKS not exercised.');
