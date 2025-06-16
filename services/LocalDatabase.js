import * as SQLite from 'expo-sqlite';


const db = SQLite.openDatabase('local.db');

// Função para gerar UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Inicializa todas as tabelas
export const initDatabase = async () => {
  return new Promise((resolve, reject) => {
    db.transaction(
      tx => {
        tx.executeSql('PRAGMA foreign_keys = ON;');
        // Tabela cargo
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS cargo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            descricao TEXT
          );`
        );

        // Tabela genero
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS genero (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL
          );`
        );

        // Tabela hierarquia
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS hierarquia (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            nivel INTEGER NOT NULL CHECK (nivel >= 1 AND nivel <= 4),
            descricao TEXT
          );`
        );

        // Tabela funcao_veiculo
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS funcao_veiculo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL
          );`
        );

        // Tabela endereco
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS endereco (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cep TEXT NOT NULL,
            uf TEXT NOT NULL,
            cidade TEXT NOT NULL,
            bairro TEXT NOT NULL,
            rua TEXT NOT NULL,
            numero TEXT NOT NULL,
            complemento TEXT,
            tipo TEXT,
            latitude REAL,
            longitude REAL
          );`
        );

        // Tabela funcao
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS funcao (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            descricao TEXT
          );`
        );

        // Tabela cliente
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS cliente (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            cpf TEXT,
            cnpj TEXT,
            rg TEXT,
            tipo TEXT NOT NULL,
            observacao TEXT,
            endereco_id INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (endereco_id) REFERENCES endereco(id)
          );`
        );

        // Tabela veiculo
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS veiculo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            placa TEXT NOT NULL UNIQUE,
            modelo TEXT NOT NULL,
            observacao TEXT,
            funcionario_id TEXT,
            funcao_veiculo_id INTEGER,
            capacidade_kg REAL CHECK (capacidade_kg > 0),
            FOREIGN KEY (funcionario_id) REFERENCES funcionario(id),
            FOREIGN KEY (funcao_veiculo_id) REFERENCES funcao_veiculo(id)
          );`
        );

        // Tabela funcionario (simplificada sem auth.users)
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS funcionario (
            id TEXT PRIMARY KEY,
            nome TEXT NOT NULL,
            data_nascimento TEXT NOT NULL,
            cpf TEXT NOT NULL UNIQUE,
            ctps TEXT,
            rg TEXT,
            data_admissao TEXT NOT NULL,
            data_demissao TEXT,
            carga_horaria INTEGER NOT NULL,
            numero_dependentes INTEGER DEFAULT 0,
            numero_ficha INTEGER,
            numero_aparelho INTEGER,
            nota INTEGER,
            observacao TEXT,
            endereco_id INTEGER,
            funcao_id INTEGER,
            genero_id INTEGER,
            cargo_id INTEGER,
            hierarquia_id INTEGER,
            rota_id INTEGER,
            horario_id INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            foto_url TEXT,
            superior_id TEXT,
            is_admin INTEGER NOT NULL DEFAULT 0 CHECK (is_admin IN (0, 1)),
            is_superior INTEGER NOT NULL DEFAULT 0 CHECK (is_superior IN (0, 1)),
            FOREIGN KEY (genero_id) REFERENCES genero(id),
            FOREIGN KEY (cargo_id) REFERENCES cargo(id),
            FOREIGN KEY (superior_id) REFERENCES funcionario(id),
            FOREIGN KEY (rota_id) REFERENCES rota(id),
            FOREIGN KEY (hierarquia_id) REFERENCES hierarquia(id),
            FOREIGN KEY (endereco_id) REFERENCES endereco(id),
            FOREIGN KEY (funcao_id) REFERENCES funcao(id)
          );`
        );

        // Tabela funcionario_fotos
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS funcionario_fotos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            funcionario_id TEXT,
            url TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (funcionario_id) REFERENCES funcionario(id)
          );`
        );

        // Tabela email
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS email (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            tipo TEXT,
            funcionario_id TEXT,
            FOREIGN KEY (funcionario_id) REFERENCES funcionario(id)
          );`
        );

        // Tabela telefone
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS telefone (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numero TEXT NOT NULL,
            tipo TEXT,
            funcionario_id TEXT,
            FOREIGN KEY (funcionario_id) REFERENCES funcionario(id)
          );`
        );

        // Tabela estoque
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS estoque (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            quantidade INTEGER NOT NULL,
            numero_serie TEXT,
            tipo TEXT,
            data_aquisicao TEXT NOT NULL,
            data_validade TEXT,
            peso REAL,
            valor REAL NOT NULL,
            modalidade TEXT,
            observacao TEXT,
            funcionario_id TEXT NOT NULL,
            cliente_id INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            quantidade_reservada INTEGER NOT NULL DEFAULT 0 CHECK (quantidade_reservada >= 0),
            disponivel_geral INTEGER NOT NULL DEFAULT 1 CHECK (disponivel_geral IN (0, 1)),
            FOREIGN KEY (funcionario_id) REFERENCES funcionario(id),
            FOREIGN KEY (cliente_id) REFERENCES cliente(id)
          );`
        );

        // Tabela balanco
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS balanco (
            id TEXT PRIMARY KEY,
            nome TEXT NOT NULL,
            data TEXT NOT NULL DEFAULT CURRENT_DATE,
            motivo TEXT,
            periodo TEXT CHECK (periodo IN ('diário', 'semanal', 'mensal', 'anual', 'customizado')),
            tipo TEXT CHECK (tipo IN ('entrada', 'saída', 'completo')),
            criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            usuario_id TEXT
          );`
        );

        // Tabela balanco_itens
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS balanco_itens (
            id TEXT PRIMARY KEY,
            balanco_id TEXT,
            descricao TEXT NOT NULL,
            valor REAL NOT NULL,
            categoria TEXT,
            tipo TEXT CHECK (tipo IN ('entrada', 'saída')),
            FOREIGN KEY (balanco_id) REFERENCES balanco(id)
          );`
        );

        // Tabela entrada
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS entrada (
            id TEXT PRIMARY KEY,
            estoque_id INTEGER NOT NULL,
            quantidade INTEGER NOT NULL CHECK (quantidade > 0),
            data_entrada TEXT NOT NULL DEFAULT CURRENT_DATE,
            fornecedor TEXT,
            responsavel_id TEXT NOT NULL,
            observacao TEXT,
            criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            nota INTEGER NOT NULL DEFAULT 0 CHECK (nota IN (0, 1)),
            FOREIGN KEY (estoque_id) REFERENCES estoque(id),
            FOREIGN KEY (responsavel_id) REFERENCES funcionario(id)
          );`
        );

        // Tabela pedido
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS pedido (
            id TEXT PRIMARY KEY,
            estoque_id INTEGER NOT NULL,
            quantidade INTEGER NOT NULL CHECK (quantidade > 0),
            cliente_id INTEGER NOT NULL,
            data_pedido TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            status TEXT NOT NULL CHECK (status IN ('pendente', 'preparacao', 'despachado', 'cancelado')),
            observacao TEXT,
            criado_por TEXT NOT NULL,
            criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            nota INTEGER NOT NULL DEFAULT 0 CHECK (nota IN (0, 1)),
            FOREIGN KEY (criado_por) REFERENCES funcionario(id),
            FOREIGN KEY (cliente_id) REFERENCES cliente(id),
            FOREIGN KEY (estoque_id) REFERENCES estoque(id)
          );`
        );

        // Tabela rota
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS rota (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            destino TEXT NOT NULL,
            distancia REAL,
            horario_partida TEXT NOT NULL,
            veiculo_id INTEGER NOT NULL,
            funcionario_id TEXT NOT NULL,
            clientes_id TEXT DEFAULT '[]',
            data_rota TEXT NOT NULL DEFAULT CURRENT_DATE,
            observacao TEXT,
            status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'cancelada')),
            tempo_medio_minutos INTEGER NOT NULL DEFAULT 0 CHECK (tempo_medio_minutos >= 0),
            FOREIGN KEY (veiculo_id) REFERENCES veiculo(id),
            FOREIGN KEY (funcionario_id) REFERENCES funcionario(id)
          );`
        );

        // Tabela rota_cliente (para relacionamento muitos-para-muitos)
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS rota_cliente (
            rota_id INTEGER NOT NULL,
            cliente_id INTEGER NOT NULL,
            PRIMARY KEY (rota_id, cliente_id),
            FOREIGN KEY (rota_id) REFERENCES rota(id),
            FOREIGN KEY (cliente_id) REFERENCES cliente(id)
          );`
        );

        // Tabela entrega
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS entrega (
            id TEXT PRIMARY KEY,
            estoque_id INTEGER NOT NULL,
            quantidade INTEGER NOT NULL CHECK (quantidade > 0),
            cliente_id INTEGER NOT NULL,
            veiculo_id INTEGER NOT NULL,
            funcionario_id TEXT NOT NULL,
            data_saida TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            data_entrega TEXT,
            status TEXT NOT NULL CHECK (status IN ('preparacao', 'a_caminho', 'entregue', 'devolucao_parcial', 'rejeitada')),
            quantidade_devolvida INTEGER DEFAULT 0 CHECK (quantidade_devolvida >= 0),
            motivo_devolucao TEXT,
            observacao TEXT,
            criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            nota INTEGER NOT NULL DEFAULT 0 CHECK (nota IN (0, 1)),
            FOREIGN KEY (veiculo_id) REFERENCES veiculo(id),
            FOREIGN KEY (estoque_id) REFERENCES estoque(id),
            FOREIGN KEY (cliente_id) REFERENCES cliente(id),
            FOREIGN KEY (funcionario_id) REFERENCES funcionario(id)
          );`
        );

        // Tabela devolucao
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS devolucao (
            id TEXT PRIMARY KEY,
            estoque_id INTEGER NOT NULL,
            quantidade INTEGER NOT NULL CHECK (quantidade > 0),
            motivo TEXT NOT NULL,
            data_devolucao TEXT NOT NULL DEFAULT CURRENT_DATE,
            responsavel_id TEXT NOT NULL,
            observacao TEXT,
            criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (estoque_id) REFERENCES estoque(id),
            FOREIGN KEY (responsavel_id) REFERENCES funcionario(id)
          );`
        );

        // Tabela saida
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS saida (
            id TEXT PRIMARY KEY,
            tipo TEXT NOT NULL CHECK (tipo IN ('pedido', 'entrega', 'manual')),
            origem_id TEXT,
            estoque_id INTEGER NOT NULL,
            quantidade INTEGER NOT NULL CHECK (quantidade > 0),
            cliente_id INTEGER,
            veiculo_id INTEGER,
            funcionario_id TEXT NOT NULL,
            data_saida TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            motivo TEXT,
            observacao TEXT,
            nota INTEGER NOT NULL DEFAULT 0 CHECK (nota IN (0, 1)),
            criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (estoque_id) REFERENCES estoque(id),
            FOREIGN KEY (cliente_id) REFERENCES cliente(id),
            FOREIGN KEY (veiculo_id) REFERENCES veiculo(id),
            FOREIGN KEY (funcionario_id) REFERENCES funcionario(id)
          );`
        );
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id TEXT PRIMARY KEY,
            funcionario_id TEXT NOT NULL,
            token TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            used INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (funcionario_id) REFERENCES funcionario(id)
          );`
        );

        // Tabela para relatórios de erro
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS error_reports (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            device_info TEXT,
            app_version TEXT,
            status TEXT DEFAULT 'pending',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
          );`
        );

        // Trigger para atualização de timestamp em error_reports
        tx.executeSql(
          `CREATE TRIGGER IF NOT EXISTS update_error_report_timestamp
          BEFORE UPDATE ON error_reports
          BEGIN
            UPDATE error_reports SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
          END;`
        );
        // Triggers para atualização automática de timestamps
        tx.executeSql(
          `CREATE TRIGGER IF NOT EXISTS update_funcionario_timestamp
           BEFORE UPDATE ON funcionario
           BEGIN
             UPDATE funcionario SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
           END;`
        );

        tx.executeSql(
          `CREATE TRIGGER IF NOT EXISTS update_cliente_timestamp
           BEFORE UPDATE ON cliente
           BEGIN
             UPDATE cliente SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
           END;`
        );

        // Trigger para atualizar estoque quando um pedido é despachado
        tx.executeSql(
          `CREATE TRIGGER IF NOT EXISTS pedido_despachado
           AFTER UPDATE ON pedido
           WHEN NEW.status = 'despachado' AND OLD.status != 'despachado'
           BEGIN
             UPDATE estoque 
             SET quantidade = quantidade - NEW.quantidade,
                 quantidade_reservada = quantidade_reservada - NEW.quantidade
             WHERE id = NEW.estoque_id;
           END;`
        );

        // Trigger para reservar estoque quando um novo pedido é criado
        tx.executeSql(
          `CREATE TRIGGER IF NOT EXISTS novo_pedido
           AFTER INSERT ON pedido
           WHEN NEW.status = 'pendente'
           BEGIN
             UPDATE estoque 
             SET quantidade_reservada = quantidade_reservada + NEW.quantidade
             WHERE id = NEW.estoque_id;
           END;`
        );

        // Trigger para liberar estoque quando um pedido é cancelado
        tx.executeSql(
          `CREATE TRIGGER IF NOT EXISTS pedido_cancelado
           AFTER UPDATE ON pedido
           WHEN NEW.status = 'cancelado' AND OLD.status != 'cancelado'
           BEGIN
             UPDATE estoque 
             SET quantidade_reservada = quantidade_reservada - NEW.quantidade
             WHERE id = NEW.estoque_id;
           END;`
        );

        // Trigger para processar entrada de estoque
        tx.executeSql(
          `CREATE TRIGGER IF NOT EXISTS depois_inserir_entrada
           AFTER INSERT ON entrada
           BEGIN
             UPDATE estoque 
             SET quantidade = quantidade + NEW.quantidade
             WHERE id = NEW.estoque_id;
           END;`
        );

        // Trigger para processar devolução
        tx.executeSql(
          `CREATE TRIGGER IF NOT EXISTS depois_inserir_devolucao
           AFTER INSERT ON devolucao
           BEGIN
             UPDATE estoque 
             SET quantidade = quantidade + NEW.quantidade
             WHERE id = NEW.estoque_id;
           END;`
        );
      },
      error => reject(error),
      () => resolve()
    );
  });
};

// Função para executar queries
const executeQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        sql,
        params,
        (_, result) => resolve(result),
        (_, error) => {
          console.error('Database error:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

// Serviço de banco de dados local
export const databaseService = {
  async insert(table, data) {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    
    const result = await executeQuery(
      `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`,
      values
    );
    return result.insertId;
  },

  async select(table, where = '', params = []) {
    const whereClause = where ? `WHERE ${where}` : '';
    const result = await executeQuery(
      `SELECT * FROM ${table} ${whereClause}`,
      params
    );
    return result.rows._array;
  },

  async update(table, data, where, params = []) {
    const setClause = Object.keys(data)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(data), ...params];
    
    const result = await executeQuery(
      `UPDATE ${table} SET ${setClause} WHERE ${where}`,
      values
    );
    return result.rowsAffected;
  },

  async delete(table, where, params = []) {
    const result = await executeQuery(
      `DELETE FROM ${table} WHERE ${where}`,
      params
    );
    return result.rowsAffected;
  },

  async insertWithUUID(table, data) {
    const id = generateUUID();
    await this.insert(table, { id, ...data });
    return id;
  },

  async getLastSync(table) {
    const result = await this.select(table, '1=1 ORDER BY last_sync DESC LIMIT 1');
    return result[0]?.last_sync || null;
  }
};

export default db;