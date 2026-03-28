import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// Chave secreta compartilhada entre Connect Skills e MentorConnect
// Adicione SYNC_SECRET no .env de ambas as plataformas com o mesmo valor
const SYNC_SECRET = process.env.SYNC_SECRET;

export async function POST(req: NextRequest) {
  // 1. Validar chave de segurança
  const authHeader = req.headers.get("x-sync-secret");
  if (!SYNC_SECRET || authHeader !== SYNC_SECRET) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  // 2. Ler body enviado pelo Connect Skills
  const body = await req.json();
  const { usuario_id, tipo } = body as { usuario_id: string; tipo: string };

  if (!usuario_id || !tipo) {
    return NextResponse.json(
      { error: "usuario_id e tipo são obrigatórios." },
      { status: 400 }
    );
  }

  // Apenas candidato e mentor são sincronizados
  if (tipo !== "candidato" && tipo !== "mentor") {
    return NextResponse.json(
      { message: `Tipo "${tipo}" não sincronizável. Ignorado.` },
      { status: 200 }
    );
  }

  // 3. Buscar dados completos no banco compartilhado
  const conn = await pool.getConnection();
  try {
    // Busca o usuário base
    const [usuarios] = await conn.execute<any[]>(
      "SELECT id, email, nome, sobrenome, tipo, created_at FROM usuario WHERE id = ?",
      [usuario_id]
    );

    if (!usuarios.length) {
      return NextResponse.json(
        { error: "Usuário não encontrado no banco." },
        { status: 404 }
      );
    }

    const usuario = usuarios[0];

    // Busca perfil específico do tipo
    let perfil: Record<string, any> = {};
    if (tipo === "candidato") {
      const [rows] = await conn.execute<any[]>(
        "SELECT nome, sobrenome, foto_perfil, cidade, estado, pais, descricao FROM candidato WHERE usuario_id = ?",
        [usuario_id]
      );
      if (rows.length) perfil = rows[0];
    } else if (tipo === "mentor") {
      const [rows] = await conn.execute<any[]>(
        "SELECT nome, sobrenome, foto_perfil, cidade, estado, pais, bio FROM mentor WHERE usuario_id = ?",
        [usuario_id]
      );
      if (rows.length) perfil = rows[0];
    }

    // 4. Verificar se já existe em mentorconnect_usuarios (cria tabela se necessário)
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS mentorconnect_usuarios (
        id VARCHAR(36) PRIMARY KEY,
        usuario_id VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL,
        nome VARCHAR(255),
        sobrenome VARCHAR(255),
        tipo ENUM('candidato', 'mentor') NOT NULL,
        foto_perfil TEXT,
        cidade VARCHAR(255),
        estado VARCHAR(255),
        pais VARCHAR(255),
        bio_descricao TEXT,
        sincronizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 5. Inserir ou atualizar (upsert)
    await conn.execute(
      `INSERT INTO mentorconnect_usuarios
        (id, usuario_id, email, nome, sobrenome, tipo, foto_perfil, cidade, estado, pais, bio_descricao)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        email = VALUES(email),
        nome = VALUES(nome),
        sobrenome = VALUES(sobrenome),
        foto_perfil = VALUES(foto_perfil),
        cidade = VALUES(cidade),
        estado = VALUES(estado),
        pais = VALUES(pais),
        bio_descricao = VALUES(bio_descricao),
        atualizado_em = CURRENT_TIMESTAMP`,
      [
        usuario_id,
        usuario.email,
        perfil.nome || usuario.nome || null,
        perfil.sobrenome || usuario.sobrenome || null,
        tipo,
        perfil.foto_perfil || null,
        perfil.cidade || null,
        perfil.estado || null,
        perfil.pais || null,
        perfil.descricao || perfil.bio || null,
      ]
    );

    return NextResponse.json({
      success: true,
      message: `${tipo} sincronizado com sucesso no MentorConnect.`,
      usuario_id,
    });
  } finally {
    conn.release();
  }
}
