import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import pg from 'pg';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const folder=path.join(root,'backups/migracao-supabase');
const connection=process.env.DIRECT_URL;
if(!connection)throw Error('Preencha DIRECT_URL no .env com a conexão de sessão do NOVO Supabase.');
const u=new URL(connection);
if(/zvtkxhokfpxrqcvigulq|czskgqxklgztvonpmaxn/.test(connection))throw Error('Restauração bloqueada: banco original PRIME ou Agrosuri.');
const local=['localhost','127.0.0.1'].includes(u.hostname);
if(!local){
 const expected=process.env.RESTORE_TARGET_PROJECT_REF;
 const actual=u.username.startsWith('postgres.')?u.username.slice('postgres.'.length):u.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/)?.[1];
 if(!expected||!actual||actual!==expected)throw Error('Defina RESTORE_TARGET_PROJECT_REF e confirme que corresponde ao project ref da DIRECT_URL do novo Supabase. Nada foi alterado.');
 console.log('Destino confirmado: novo Supabase '+expected+' ('+u.hostname+').');
}
const pool=new pg.Pool({connectionString:connection,ssl:local?false:{rejectUnauthorized:false}});
function run(cmd,args){const r=spawnSync(cmd,args,{encoding:'utf8',env:{...process.env,PGHOST:u.hostname,PGPORT:u.port||'5432',PGUSER:decodeURIComponent(u.username),PGPASSWORD:decodeURIComponent(u.password),PGDATABASE:u.pathname.slice(1),PGSSLMODE:local?'disable':'require'}});if(r.status!==0)throw Error(r.stderr||'Falha no PostgreSQL');return r.stdout;}
try {
 const existing=await pool.query("select tablename from pg_tables where schemaname='public'");
 const resume=process.env.RESUME_RESTORE_AFTER_IMPORT==='1';
 if(existing.rowCount&&!resume)throw Error('Use um banco novo: o schema public já contém tabelas. Nada foi alterado.');
 if(!existing.rowCount){
  const dump=path.join(folder,'aplicacao.dump');
  const list=run('pg_restore',['--list',dump]).split('\n').filter(line=>!/^\d+;.* SCHEMA - public /.test(line)).join('\n');
  const listPath=path.join(folder,'restauracao.list');fs.writeFileSync(listPath,list);
  run('pg_restore',['--dbname='+u.pathname.slice(1),'--no-owner','--no-acl','--single-transaction','--use-list='+listPath,dump]);
 }else{
  console.log('Retomando somente a validação e a troca de URLs no destino já importado.');
 }
 const assets=JSON.parse(fs.readFileSync(path.join(folder,'arquivos-externos.json'))).filter(x=>x.local);
 const missingAssets=assets.filter(x=>!fs.existsSync(path.join(root,'public',x.local.replace(/^\/?public\//,''))));
 if(missingAssets.length)throw Error('Imagens locais ausentes: '+missingAssets.length);
 const source=JSON.parse(fs.readFileSync(path.join(folder,'dados.json')));
 const columns=(await pool.query("select table_name,column_name,data_type from information_schema.columns where table_schema='public' and data_type in ('text','character varying','json','jsonb')")).rows;
 const client=await pool.connect();
 try {
  await client.query('BEGIN');
  for(const col of columns){
   const rows=source[col.table_name]||[];
   const relevant=assets.filter(asset=>rows.some(row=>JSON.stringify(row[col.column_name]??null).includes(asset.url)));
   if(!relevant.length)continue;
   const table='"'+col.table_name.replaceAll('"','""')+'"';
   const field='"'+col.column_name.replaceAll('"','""')+'"';
   const cast=col.data_type==='jsonb'?'jsonb':col.data_type==='json'?'json':'text';
   for(let offset=0;offset<relevant.length;offset+=25){
    const chunk=relevant.slice(offset,offset+25);let expression=field+'::text';const params=[];const filters=[];
    for(const asset of chunk){params.push(asset.url,asset.local);expression=`replace(${expression},$${params.length-1},$${params.length})`;filters.push(`position($${params.length-1} in ${field}::text)>0`);}
    await client.query(`UPDATE public.${table} SET ${field}=${expression}::${cast} WHERE ${filters.join(' OR ')}`,params);
   }
  }
  await client.query('COMMIT');
 }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
 for(const [table,rows] of Object.entries(source)){
  const r=await pool.query('SELECT id FROM public."'+table+'"');
  if(r.rowCount!==rows.length)throw Error('Contagem divergente: '+table);
  const sourceIds=new Set(rows.map(row=>String(row.id)));
  if(r.rows.some(row=>!sourceIds.has(String(row.id))))throw Error('IDs divergentes: '+table);
  console.log(table+': '+rows.length+' registros, IDs conferidos');
 }
 const broken=await pool.query(`SELECT
  (SELECT count(*) FROM public.app_refresh_tokens t LEFT JOIN public.app_users u ON u.id=t.user_id WHERE u.id IS NULL)::int AS refresh_tokens,
  (SELECT count(*) FROM public.app_contracts c LEFT JOIN public.app_users u ON u.id=c.client_user_id WHERE c.client_user_id IS NOT NULL AND u.id IS NULL)::int AS contracts,
  (SELECT count(*) FROM public.app_invoices i LEFT JOIN public.app_users u ON u.id=i.client_user_id WHERE i.client_user_id IS NOT NULL AND u.id IS NULL)::int AS invoices`);
 if(Object.values(broken.rows[0]).some(n=>n>0))throw Error('Relacionamentos quebrados após restauração.');
 console.log('Imagens locais: '+assets.length+'; relacionamentos conferidos.');
 console.log('Restauração concluída. Todas as contagens conferem.');
} finally {await pool.end();}
