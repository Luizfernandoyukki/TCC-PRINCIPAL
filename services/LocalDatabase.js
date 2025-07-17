import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

let db = null;
let operationQueue = [];
let isInitialized = false;

const processQueue = () => {
  operationQueue.forEach(op => {
    try {
      op.resolve(db.executeAsync(op.sql, op.params));
    } catch (error) {
      op.reject(error);
    }
  });
  operationQueue = [];
};

export const initDatabase = async () => {
  if (Platform.OS === 'web') throw new Error('SQLite não suportado no navegador');
  if (!SQLite || !SQLite.openDatabaseAsync) throw new Error('SQLite não disponível');

  db = await SQLite.openDatabaseAsync('localDatabase.db');
  isInitialized = true;
  processQueue();

  const tableCheck = await db.getAllAsync(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='funcionario'"
  );
  if (tableCheck.length > 0) return;

    await db.execAsync(`
    -- ====================
    -- ENDEREÇO, TELEFONE, EMAIL
    -- ====================
    CREATE TABLE IF NOT EXISTS endereco (
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
      longitude REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_sync TEXT
    );

    CREATE TABLE IF NOT EXISTS telefone (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT NOT NULL,
      tipo TEXT,
      funcionario_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_sync TEXT,
      FOREIGN KEY (funcionario_id) REFERENCES funcionario(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS email (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      tipo TEXT,
      funcionario_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_sync TEXT,
      FOREIGN KEY (funcionario_id) REFERENCES funcionario(id) ON DELETE CASCADE
    );

    -- ====================
    -- FUNCIONÁRIO
    -- ====================
    CREATE TABLE IF NOT EXISTS funcionario (
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
      hierarquia_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_sync TEXT,
      foto_url TEXT,
      superior_id TEXT,
      senha TEXT,
      is_admin INTEGER NOT NULL DEFAULT 0 CHECK (is_admin IN (0, 1)),
      is_superior INTEGER NOT NULL DEFAULT 0 CHECK (is_superior IN (0, 1)),
      FOREIGN KEY (genero_id) REFERENCES genero(id),
      FOREIGN KEY (superior_id) REFERENCES funcionario(id),
      FOREIGN KEY (hierarquia_id) REFERENCES hierarquia(id),
      FOREIGN KEY (endereco_id) REFERENCES endereco(id),
      FOREIGN KEY (funcao_id) REFERENCES funcao(id)
    );

    -- ====================
    -- CLIENTE
    -- ====================
    CREATE TABLE IF NOT EXISTS cliente (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cpf TEXT,
      cnpj TEXT,
      tipo TEXT NOT NULL,
      observacao TEXT,
      endereco_id INTEGER NOT NULL,
      status TEXT DEFAULT 'ativo',
      telefone_id INTEGER,
      email_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_sync TEXT,
      FOREIGN KEY (endereco_id) REFERENCES endereco(id),
      FOREIGN KEY (telefone_id) REFERENCES telefone(id),
      FOREIGN KEY (email_id) REFERENCES email(id)
    );

    CREATE TABLE IF NOT EXISTS estoque (
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
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_sync TEXT,
      quantidade_reservada INTEGER NOT NULL DEFAULT 0 CHECK (quantidade_reservada >= 0),
      disponivel_geral INTEGER NOT NULL DEFAULT 1 CHECK (disponivel_geral IN (0, 1)),
      FOREIGN KEY (funcionario_id) REFERENCES funcionario(id),
      FOREIGN KEY (cliente_id) REFERENCES cliente(id)
    );

    CREATE TABLE IF NOT EXISTS entrada (
      id TEXT PRIMARY KEY,
      estoque_id INTEGER NOT NULL,
      quantidade INTEGER NOT NULL CHECK (quantidade > 0),
      data_entrada TEXT NOT NULL DEFAULT CURRENT_DATE,
      fornecedor TEXT,
      responsavel_id TEXT NOT NULL,
      observacao TEXT,
      criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_sync TEXT,
      nota INTEGER NOT NULL DEFAULT 0 CHECK (nota IN (0, 1)),
      tipo_pagamento TEXT DEFAULT 'dinheiro' CHECK (tipo_pagamento IN ('dinheiro', 'boleto', 'cheque', 'vale', 'pix', 'cartao')),
      valor_unitario REAL,
      valor_total REAL,
      FOREIGN KEY (estoque_id) REFERENCES estoque(id),
      FOREIGN KEY (responsavel_id) REFERENCES funcionario(id)
    );

    CREATE TABLE IF NOT EXISTS saida (
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
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_sync TEXT,
      tipo_pagamento TEXT DEFAULT 'dinheiro',
      valor_unitario REAL,
      valor_total REAL,
      FOREIGN KEY (estoque_id) REFERENCES estoque(id),
      FOREIGN KEY (cliente_id) REFERENCES cliente(id),
      FOREIGN KEY (veiculo_id) REFERENCES veiculo(id),
      FOREIGN KEY (funcionario_id) REFERENCES funcionario(id)
    );

    CREATE TABLE IF NOT EXISTS pedido (
      id TEXT PRIMARY KEY,
      estoque_id INTEGER NOT NULL,
      quantidade INTEGER NOT NULL CHECK (quantidade > 0),
      cliente_id INTEGER NOT NULL,
      data_pedido TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL CHECK (status IN ('pendente', 'preparacao', 'despachado', 'cancelado')),
      observacao TEXT,
      criado_por TEXT NOT NULL,
      criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_sync TEXT,
      nota INTEGER NOT NULL DEFAULT 0 CHECK (nota IN (0, 1)),
      tipo_pagamento TEXT DEFAULT 'dinheiro',
      valor_unitario REAL,
      valor_total REAL,
      FOREIGN KEY (criado_por) REFERENCES funcionario(id),
      FOREIGN KEY (cliente_id) REFERENCES cliente(id),
      FOREIGN KEY (estoque_id) REFERENCES estoque(id)
    );

    CREATE TABLE IF NOT EXISTS entrega (
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
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_sync TEXT,
      nota INTEGER NOT NULL DEFAULT 0 CHECK (nota IN (0, 1)),
      tipo_pagamento TEXT DEFAULT 'dinheiro',
      valor_unitario REAL,
      valor_total REAL,
      FOREIGN KEY (veiculo_id) REFERENCES veiculo(id),
      FOREIGN KEY (estoque_id) REFERENCES estoque(id),
      FOREIGN KEY (cliente_id) REFERENCES cliente(id),
      FOREIGN KEY (funcionario_id) REFERENCES funcionario(id)
    );

    CREATE TABLE IF NOT EXISTS devolucao (
      id TEXT PRIMARY KEY,
      estoque_id INTEGER NOT NULL,
      quantidade INTEGER NOT NULL CHECK (quantidade > 0),
      motivo TEXT NOT NULL,
      data_devolucao TEXT NOT NULL DEFAULT CURRENT_DATE,
      responsavel_id TEXT NOT NULL,
      observacao TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_sync TEXT,
      FOREIGN KEY (estoque_id) REFERENCES estoque(id),
      FOREIGN KEY (responsavel_id) REFERENCES funcionario(id)
    );

    CREATE TABLE IF NOT EXISTS despacho_reserva (
      id TEXT PRIMARY KEY,
      data_criacao TEXT DEFAULT CURRENT_TIMESTAMP,
      responsavel_id TEXT NOT NULL,
      observacao TEXT,
      FOREIGN KEY (responsavel_id) REFERENCES funcionario(id)
    );

    CREATE TABLE IF NOT EXISTS despacho_reserva_item (
      id TEXT PRIMARY KEY,
      despacho_id TEXT NOT NULL,
      estoque_id INTEGER NOT NULL,
      quantidade_reservada INTEGER NOT NULL CHECK (quantidade_reservada > 0),
      quantidade_consumida INTEGER NOT NULL DEFAULT 0 CHECK (quantidade_consumida >= 0),
      observacao TEXT,
      FOREIGN KEY (despacho_id) REFERENCES despacho_reserva(id),
      FOREIGN KEY (estoque_id) REFERENCES estoque(id)
    );

    CREATE TABLE IF NOT EXISTS despacho_consumo (
      id TEXT PRIMARY KEY,
      reserva_item_id TEXT NOT NULL,
      cliente_id INTEGER NOT NULL,
      funcionario_id TEXT NOT NULL,
      quantidade INTEGER NOT NULL CHECK (quantidade > 0),
      data_consumo TEXT DEFAULT CURRENT_TIMESTAMP,
      observacao TEXT,
      FOREIGN KEY (reserva_item_id) REFERENCES despacho_reserva_item(id),
      FOREIGN KEY (cliente_id) REFERENCES cliente(id),
      FOREIGN KEY (funcionario_id) REFERENCES funcionario(id)
    );
    -- Atualiza 'updated_at' em todas as tabelas
    CREATE TRIGGER IF NOT EXISTS update_funcionario_timestamp
    BEFORE UPDATE ON funcionario
    BEGIN
      UPDATE funcionario SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS update_cliente_timestamp
    BEFORE UPDATE ON cliente
    BEGIN
      UPDATE cliente SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS update_estoque_timestamp
    BEFORE UPDATE ON estoque
    BEGIN
      UPDATE estoque SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;

    -- ENTRADA: Aumenta estoque ao registrar entrada
    CREATE TRIGGER IF NOT EXISTS entrada_add_estoque
    AFTER INSERT ON entrada
    BEGIN
      UPDATE estoque 
      SET quantidade = quantidade + NEW.quantidade
      WHERE id = NEW.estoque_id;
    END;

    -- PEDIDO: Reserva estoque quando status = 'pendente'
    CREATE TRIGGER IF NOT EXISTS pedido_reserva_estoque
    AFTER INSERT ON pedido
    WHEN NEW.status = 'pendente'
    BEGIN
      UPDATE estoque 
      SET quantidade_reservada = quantidade_reservada + NEW.quantidade
      WHERE id = NEW.estoque_id;
    END;

    -- PEDIDO: Baixa estoque e cria entrega/saída quando despachado
    CREATE TRIGGER IF NOT EXISTS pedido_despachado
    AFTER UPDATE ON pedido
    WHEN NEW.status = 'despachado' AND OLD.status != 'despachado'
    BEGIN
      -- Baixa estoque
      UPDATE estoque 
      SET quantidade = quantidade - NEW.quantidade,
          quantidade_reservada = quantidade_reservada - NEW.quantidade
      WHERE id = NEW.estoque_id;

      -- Cria entrega automática
      INSERT INTO entrega (
        id, estoque_id, quantidade, cliente_id, veiculo_id,
        funcionario_id, status, nota, valor_unitario, valor_total
      ) VALUES (
        hex(randomblob(16)), NEW.estoque_id, NEW.quantidade, NEW.cliente_id, NULL,
        NEW.criado_por, 'entregue', NEW.nota, NEW.valor_unitario, NEW.valor_total
      );

      -- Registra saída
      INSERT INTO saida (
        tipo, origem_id, estoque_id, quantidade, cliente_id,
        funcionario_id, nota, valor_unitario, valor_total
      ) VALUES (
        'pedido', NEW.id, NEW.estoque_id, NEW.quantidade, NEW.cliente_id,
        NEW.criado_por, NEW.nota, NEW.valor_unitario, NEW.valor_total
      );
    END;

    -- PEDIDO: Cancela reserva se pedido for cancelado
    CREATE TRIGGER IF NOT EXISTS pedido_cancelado
    AFTER UPDATE ON pedido
    WHEN NEW.status = 'cancelado' AND OLD.status != 'cancelado'
    BEGIN
      UPDATE estoque 
      SET quantidade_reservada = quantidade_reservada - NEW.quantidade
      WHERE id = NEW.estoque_id;
    END;

    -- ENTREGA: Gera saída e baixa estoque quando concluída
    CREATE TRIGGER IF NOT EXISTS entrega_concluida
    AFTER UPDATE ON entrega
    WHEN NEW.status = 'entregue' AND OLD.status != 'entregue'
    BEGIN
      -- Baixa estoque
      UPDATE estoque 
      SET quantidade = quantidade - NEW.quantidade
      WHERE id = NEW.estoque_id;

      -- Registra saída
      INSERT INTO saida (
        tipo, origem_id, estoque_id, quantidade, cliente_id,
        veiculo_id, funcionario_id, nota, valor_unitario, valor_total
      ) VALUES (
        'entrega', NEW.id, NEW.estoque_id, NEW.quantidade, NEW.cliente_id,
        NEW.veiculo_id, NEW.funcionario_id, NEW.nota, NEW.valor_unitario, NEW.valor_total
      );
    END;

    -- ENTREGA: Devolução parcial (volta itens para estoque)
    CREATE TRIGGER IF NOT EXISTS devolucao_parcial
    AFTER UPDATE ON entrega
    WHEN NEW.status = 'devolucao_parcial' AND OLD.status != 'devolucao_parcial'
    BEGIN
      -- Devolve itens ao estoque
      UPDATE estoque 
      SET quantidade = quantidade + NEW.quantidade_devolvida
      WHERE id = NEW.estoque_id;

      -- Registra devolução
      INSERT INTO devolucao (
        id, estoque_id, quantidade, motivo, responsavel_id, observacao
      ) VALUES (
        hex(randomblob(16)), NEW.estoque_id, NEW.quantidade_devolvida,
        COALESCE(NEW.motivo_devolucao, 'Devolução parcial'), NEW.funcionario_id,
        'Gerada automaticamente pela entrega ' || NEW.id
      );
    END;

    -- DESPACHO CONSUMO: Atualiza quantidade consumida
    CREATE TRIGGER IF NOT EXISTS atualizar_consumo
    AFTER INSERT ON despacho_consumo
    BEGIN
      UPDATE despacho_reserva_item
      SET quantidade_consumida = quantidade_consumida + NEW.quantidade
      WHERE id = NEW.reserva_item_id;
    END;

    -- DESPACHO CONSUMO: Valida limite da reserva
    CREATE TRIGGER IF NOT EXISTS validar_limite_consumo
    BEFORE INSERT ON despacho_consumo
    BEGIN
      SELECT CASE
        WHEN (
          (SELECT quantidade_reservada - quantidade_consumida
           FROM despacho_reserva_item
           WHERE id = NEW.reserva_item_id
          ) < NEW.quantidade
        )
        THEN RAISE(ABORT, 'Consumo excede a reserva disponível')
      END;
    END;

    -- DESPACHO: Devolve saldo não consumido ao excluir reserva
    CREATE TRIGGER IF NOT EXISTS devolver_saldo_despacho
    AFTER DELETE ON despacho_reserva
    BEGIN
      -- Para cada item da reserva excluída
      FOR item IN (SELECT * FROM despacho_reserva_item WHERE despacho_id = OLD.id)
      LOOP
        -- Calcula saldo não consumido
        DECLARE saldo INTEGER;
        SET saldo = item.quantidade_reservada - item.quantidade_consumida;

        -- Se houver saldo, devolve ao estoque
        IF saldo > 0 THEN
          UPDATE estoque
          SET quantidade = quantidade + saldo
          WHERE id = item.estoque_id;

          -- Registra devolução
          INSERT INTO devolucao (
            id, estoque_id, quantidade, motivo, responsavel_id, observacao
          ) VALUES (
            hex(randomblob(16)), item.estoque_id, saldo,
            'Devolução de saldo não utilizado', OLD.responsavel_id,
            'Devolução automática do despacho ' || OLD.id
          );
        END IF;
      END LOOP;
    END;

    -- ESTOQUE: Impede reserva maior que quantidade disponível
    CREATE TRIGGER IF NOT EXISTS validar_reserva_estoque
    BEFORE UPDATE ON estoque
    WHEN NEW.quantidade_reservada > NEW.quantidade
    BEGIN
      SELECT RAISE(ABORT, 'Quantidade reservada excede o estoque disponível');
    END;
  `);
  console.log('Banco de dados local criado com sucesso.');
};

export const databaseService = {
  async executeQuery(sql, params = []) {
    if (!isInitialized) throw new Error('Banco de dados não inicializado');
    
    try {
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const result = await db.getAllAsync(sql, params);
        return { rows: result };
      } else {
        const result = await db.runAsync(sql, params);
        return result;
      }
    } catch (error) {
      console.error('Erro na query:', sql, error);
      throw error;
    }
  },

  async insert(table, data) {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
    
    try {
      const result = await this.executeQuery(sql, values);
      return { success: true, id: result.lastInsertRowId };
    } catch (error) {
      return { success: false, error };
    }
  },

  async select(table, where = '', params = [], orderBy = '', limit = '') {
    const whereClause = where ? `WHERE ${where}` : '';
    const orderClause = orderBy ? `ORDER BY ${orderBy}` : '';
    const limitClause = limit ? `LIMIT ${limit}` : '';
    const sql = `SELECT * FROM ${table} ${whereClause} ${orderClause} ${limitClause}`;
    
    try {
      const result = await this.executeQuery(sql, params);
      return { success: true, data: result.rows || [] };
    } catch (error) {
      return { success: false, error };
    }
  },

  async update(table, data, where, params = []) {
    const setClause = Object.keys(data)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(data), ...params];
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
    
    try {
      const result = await this.executeQuery(sql, values);
      return { success: true, changes: result.changes };
    } catch (error) {
      return { success: false, error };
    }
  },

  async delete(table, where, params = []) {
    const sql = `DELETE FROM ${table} WHERE ${where}`;
    
    try {
      const result = await this.executeQuery(sql, params);
      return { success: true, changes: result.changes };
    } catch (error) {
      return { success: false, error };
    }
  },

  async insertWithUUID(table, data) {
    const id = this.generateUUID();
    const result = await this.insert(table, { id, ...data });
    return { ...result, id };
  },

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  async getLastSync(table) {
    try {
      const result = await this.executeQuery(
        `SELECT last_sync FROM ${table} ORDER BY last_sync DESC LIMIT 1`
      );
      return result.rows?.length > 0 ? result.rows[0].last_sync : null;
    } catch (error) {
      console.error(`Erro ao obter last_sync para ${table}:`, error);
      return null;
    }
  },

  async updateLastSync(table, date = new Date().toISOString()) {
    try {
      await this.executeQuery(
        `UPDATE ${table} SET last_sync = ?`,
        [date]
      );
      return true;
    } catch (error) {
      console.error(`Erro ao atualizar last_sync para ${table}:`, error);
      return false;
    }
  },

  async getUnsyncedRecords(table) {
    try {
      const result = await this.executeQuery(
        `SELECT * FROM ${table} WHERE last_sync IS NULL OR updated_at > last_sync`
      );
      return result.rows || [];
    } catch (error) {
      console.error(`Erro ao buscar registros não sincronizados de ${table}:`, error);
      return [];
    }
  },

  async tableExists(tableName) {
    try {
      const result = await this.executeQuery(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
        [tableName]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Erro ao verificar existência da tabela ${tableName}:`, error);
      return false;
    }
  },

  async transaction(operations) {
    try {
      await db.execAsync('BEGIN TRANSACTION');
      const results = [];
      
      for (const op of operations) {
        const result = await this.executeQuery(op.sql, op.params);
        results.push(result);
      }
      
      await db.execAsync('COMMIT');
      return { success: true, results };
    } catch (error) {
      await db.execAsync('ROLLBACK');
      return { success: false, error };
    }
  }
};


export const getDbInstance = () => db;

export const closeDatabase = async () => {
  if (db) {
    await db.closeAsync();
    db = null;
    console.log('Conexão com o banco de dados fechada');
  }
};

export const deleteDatabase = async () => {
  if (db) {
    await db.closeAsync();
    await SQLite.deleteDatabaseAsync('localDatabase.db');
    db = null;
    console.log('Banco de dados deletado');
  }
};