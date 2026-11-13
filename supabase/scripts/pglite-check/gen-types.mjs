// Generates a `supabase gen types typescript`-shaped Database type by
// introspecting a migrated (PGlite) database. Also emits literal value lists
// from single-column CHECK (... IN (...)) constraints.

const TS = {
  bool: 'boolean',
  int2: 'number', int4: 'number', int8: 'number', float4: 'number', float8: 'number', numeric: 'number',
  text: 'string', varchar: 'string', bpchar: 'string', uuid: 'string', citext: 'string', name: 'string',
  date: 'string', time: 'string', timetz: 'string', timestamp: 'string', timestamptz: 'string', interval: 'string',
  json: 'Json', jsonb: 'Json',
};
const tsOf = (typname, elem) => {
  if (elem) return `${TS[elem] ?? 'unknown'}[]`;
  return TS[typname] ?? 'unknown';
};
const key = (k) => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(k) ? k : JSON.stringify(k));

export async function generateTypes(db) {
  const cols = (await db.query(`
    select c.relname as rel, c.relkind as kind, a.attname as col, t.typname, et.typname as elem,
           not a.attnotnull as nullable, a.atthasdef as has_default, a.attidentity as identity, a.attgenerated as generated
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_type t on t.oid = a.atttypid
    left join pg_type et on et.oid = t.typelem and t.typcategory = 'A'
    where n.nspname = 'public' and c.relkind in ('r', 'v') and a.attnum > 0 and not a.attisdropped
    order by c.relname, a.attname`)).rows;

  const fks = (await db.query(`
    select con.conname, c.relname as rel, rc.relname as ref_rel, rn.nspname as ref_schema,
      array(select a.attname::text from unnest(con.conkey) with ordinality k(n, o)
            join pg_attribute a on a.attrelid = con.conrelid and a.attnum = k.n order by k.o) as columns,
      array(select a.attname::text from unnest(con.confkey) with ordinality k(n, o)
            join pg_attribute a on a.attrelid = con.confrelid and a.attnum = k.n order by k.o) as ref_columns,
      exists (select 1 from pg_constraint u where u.conrelid = con.conrelid and u.contype in ('p', 'u')
              and (select array_agg(x order by x) from unnest(u.conkey) x) = (select array_agg(x order by x) from unnest(con.conkey) x)) as one_to_one
    from pg_constraint con
    join pg_class c on c.oid = con.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_class rc on rc.oid = con.confrelid
    join pg_namespace rn on rn.oid = rc.relnamespace
    where con.contype = 'f' and n.nspname = 'public'
    order by c.relname, con.conname`)).rows;

  const types = new Map((await db.query(`select oid::int as oid, typname from pg_type`)).rows.map((r) => [Number(r.oid), r.typname]));
  const elemOf = new Map((await db.query(`select t.oid::int as oid, et.typname from pg_type t join pg_type et on et.oid = t.typelem where t.typcategory = 'A'`)).rows.map((r) => [Number(r.oid), r.typname]));
  const fns = (await db.query(`
    select p.proname, p.pronargs, p.pronargdefaults, p.proretset, p.prorettype::int as rettype,
           coalesce(p.proallargtypes::int[], p.proargtypes::int[]) as argtypes, p.proargmodes::text[] as modes, p.proargnames as names
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' order by p.proname`)).rows;

  const checks = (await db.query(`
    select c.relname as rel, a.attname as col, pg_get_constraintdef(con.oid) as def
    from pg_constraint con
    join pg_class c on c.oid = con.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = con.conrelid and a.attnum = con.conkey[1]
    where n.nspname = 'public' and con.contype = 'c' and array_length(con.conkey, 1) = 1
    order by c.relname, a.attname`)).rows;

  const rels = new Map();
  for (const c of cols) {
    if (!rels.has(c.rel)) rels.set(c.rel, { kind: c.kind, cols: [] });
    rels.get(c.rel).cols.push(c);
  }

  const I = (n) => '  '.repeat(n);
  const out = [];
  out.push(`export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3"
  }
  public: {
    Tables: {`);

  const relationshipsOf = (rel) => {
    const list = fks.filter((f) => f.rel === rel && f.ref_schema === 'public');
    if (list.length === 0) return `${I(4)}Relationships: []`;
    const lines = [`${I(4)}Relationships: [`];
    for (const f of list) {
      lines.push(`${I(5)}{`,
        `${I(6)}foreignKeyName: "${f.conname}"`,
        `${I(6)}columns: [${f.columns.map((x) => `"${x}"`).join(', ')}]`,
        `${I(6)}isOneToOne: ${f.one_to_one}`,
        `${I(6)}referencedRelation: "${f.ref_rel}"`,
        `${I(6)}referencedColumns: [${f.ref_columns.map((x) => `"${x}"`).join(', ')}]`,
        `${I(5)}},`);
    }
    lines.push(`${I(4)}]`);
    return lines.join('\n');
  };

  for (const [rel, r] of [...rels].filter(([, r]) => r.kind === 'r')) {
    out.push(`${I(3)}${key(rel)}: {`);
    out.push(`${I(4)}Row: {`);
    for (const c of r.cols) out.push(`${I(5)}${key(c.col)}: ${tsOf(c.typname, c.elem)}${c.nullable ? ' | null' : ''}`);
    out.push(`${I(4)}}`, `${I(4)}Insert: {`);
    for (const c of r.cols) {
      const optional = c.nullable || c.has_default || c.identity !== '' || c.generated !== '';
      out.push(`${I(5)}${key(c.col)}${optional ? '?' : ''}: ${tsOf(c.typname, c.elem)}${c.nullable ? ' | null' : ''}`);
    }
    out.push(`${I(4)}}`, `${I(4)}Update: {`);
    for (const c of r.cols) out.push(`${I(5)}${key(c.col)}?: ${tsOf(c.typname, c.elem)}${c.nullable ? ' | null' : ''}`);
    out.push(`${I(4)}}`, relationshipsOf(rel), `${I(3)}}`);
  }
  out.push(`${I(2)}}`, `${I(2)}Views: {`);
  for (const [rel, r] of [...rels].filter(([, r]) => r.kind === 'v')) {
    out.push(`${I(3)}${key(rel)}: {`, `${I(4)}Row: {`);
    for (const c of r.cols) out.push(`${I(5)}${key(c.col)}: ${tsOf(c.typname, c.elem)} | null`);
    out.push(`${I(4)}}`, `${I(4)}Relationships: []`, `${I(3)}}`);
  }
  out.push(`${I(2)}}`, `${I(2)}Functions: {`);
  for (const f of fns) {
    if (types.get(Number(f.rettype)) === 'trigger') continue;
    const argtypes = (f.argtypes ?? []).map(Number);
    const modes = f.modes ?? argtypes.map(() => 'i');
    const names = f.names ?? [];
    const inputs = [];
    const outputs = [];
    argtypes.forEach((t, i) => {
      const entry = { name: names[i] ?? `arg${i}`, ts: tsOf(types.get(t), elemOf.get(t)) };
      if (['i', 'b', 'v'].includes(modes[i])) inputs.push(entry); else outputs.push(entry);
    });
    const firstDefault = inputs.length - Number(f.pronargdefaults);
    inputs.forEach((a, i) => { a.optional = i >= firstDefault; });
    const args = inputs.length === 0 ? 'never' : `{ ${[...inputs].sort((a, b) => a.name.localeCompare(b.name)).map((a) => `${key(a.name)}${a.optional ? '?' : ''}: ${a.ts}`).join('; ')} }`;
    let ret;
    if (outputs.length > 0) {
      ret = `{\n${[...outputs].sort((a, b) => a.name.localeCompare(b.name)).map((o) => `${I(5)}${key(o.name)}: ${o.ts}`).join('\n')}\n${I(4)}}[]`;
    } else {
      const rt = types.get(Number(f.rettype));
      ret = rt === 'void' ? 'undefined' : tsOf(rt, elemOf.get(Number(f.rettype)));
      if (f.proretset) ret = `${ret}[]`;
    }
    out.push(`${I(3)}${key(f.proname)}: {`, `${I(4)}Args: ${args}`, `${I(4)}Returns: ${ret}`, `${I(3)}}`);
  }
  out.push(`${I(2)}}`,
    `${I(2)}Enums: {`, `${I(3)}[_ in never]: never`, `${I(2)}}`,
    `${I(2)}CompositeTypes: {`, `${I(3)}[_ in never]: never`, `${I(2)}}`,
    `${I(1)}}`, '}');

  out.push(HELPERS);

  // ---- literal values from CHECK constraints
  const values = {};
  for (const c of checks) {
    const m = c.def.match(/ANY \(\(?ARRAY\[(.+?)\]\)?/);
    if (!m || !c.def.startsWith(`CHECK ((${c.col} = ANY`) && !c.def.startsWith(`CHECK (("${c.col}" = ANY`)) continue;
    const vals = [...m[1].matchAll(/'([^']*)'::text/g)].map((x) => x[1]);
    if (vals.length === 0) continue;
    (values[c.rel] ??= {})[c.col] = vals;
  }
  return { types: out.join('\n') + '\n', values };
}

const HELPERS = `
type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const`;
