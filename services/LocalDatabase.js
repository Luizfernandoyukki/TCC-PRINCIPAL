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
  console.log('Iniciando inicialização do banco de dados local...');

  if (Platform.OS === 'web') {
    console.warn('SQLite não é suportado no navegador.');
    throw new Error('SQLite não disponível no navegador.');
  }

  // Verifica se o módulo SQLite está disponível
  if (!SQLite || !SQLite.openDatabaseAsync) {
    console.error('Módulo SQLite não está disponível:', SQLite);
    throw new Error('Módulo SQLite não está disponível');
  }

  try {
    // Abrir conexão com o banco de dados
    console.log('Abrindo conexão com o banco de dados...');
     db = await SQLite.openDatabaseAsync('localDatabase.db');
    isInitialized = true;
    processQueue(); // Processa operações pendentes
    
    // Verificar se a conexão foi estabelecida
    if (!db) {
      throw new Error('Falha ao abrir conexão com o banco de dados');
    }
    console.log('Conexão com o banco de dados estabelecida com sucesso');

    // Verificar se as tabelas já existem
    const tableCheck = await db.getAllAsync(
  `SELECT name FROM sqlite_master WHERE type='table' AND name='funcionario'`
);

if (!tableCheck || tableCheck.length === 0) {
  console.log('Tabela funcionario não existe, criando tabelas...');
  // Proceda com a criação das tabelas
}

    // Se a tabela não existe, criar todas as tabelas
    if (!tableCheck) {
      console.log('Criando tabelas do banco de dados...');
      
      
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      -- Tabela de Cargos
      CREATE TABLE IF NOT EXISTS cargo (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        descricao TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_sync TEXT
      );

      -- Tabela de Gêneros
      CREATE TABLE IF NOT EXISTS genero (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_sync TEXT
      );

      -- Tabela de Hierarquia
      CREATE TABLE IF NOT EXISTS hierarquia (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        nivel INTEGER NOT NULL CHECK (nivel >= 1 AND nivel <= 4),
        descricao TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_sync TEXT
      );

      -- Tabela de Endereços
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

      -- Tabela de Funções
      CREATE TABLE IF NOT EXISTS funcao (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        descricao TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_sync TEXT
      );

      -- Tabela de Clientes
      CREATE TABLE cliente (
      id INTEGER PRIMARY KEY,
      nome TEXT NOT NULL,
      cpf TEXT,
      cnpj TEXT,
      tipo TEXT NOT NULL,
      observacao TEXT,
      endereco_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'ativo',
      telefone_id INTEGER,
      email_id INTEGER,
      dias_entrega TEXT,
      FOREIGN KEY (endereco_id) REFERENCES endereco(id),
      FOREIGN KEY (telefone_id) REFERENCES telefone(id),
      FOREIGN KEY (email_id) REFERENCES email(id)
    );


      -- Tabela de Veículos
      CREATE TABLE IF NOT EXISTS veiculo (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        placa TEXT NOT NULL UNIQUE,
        modelo TEXT NOT NULL,
        observacao TEXT,
        funcionario_id TEXT,
        capacidade_kg REAL CHECK (capacidade_kg > 0),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_sync TEXT,
        FOREIGN KEY (funcionario_id) REFERENCES funcionario(id)
      );

      -- Tabela de Rotas
      CREATE TABLE IF NOT EXISTS rota (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        destino TEXT NOT NULL,
        distancia REAL,
        horario_partida TEXT NOT NULL,
        veiculo_id INTEGER NOT NULL,
        funcionario_id TEXT NOT NULL,
        clientes_id TEXT,
        data_rota TEXT NOT NULL DEFAULT CURRENT_DATE,
        observacao TEXT,
        status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'cancelada')),
        tempo_medio_minutos INTEGER NOT NULL DEFAULT 0 CHECK (tempo_medio_minutos >= 0),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_sync TEXT,
        FOREIGN KEY (veiculo_id) REFERENCES veiculo(id),
        FOREIGN KEY (funcionario_id) REFERENCES funcionario(id)
      );

      -- Tabela de Funcionários
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
        cargo_id INTEGER,
        hierarquia_id INTEGER,
        rota_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_sync TEXT,
        foto_url TEXT,
        superior_id TEXT,
        senha TEXT,
        is_admin INTEGER NOT NULL DEFAULT 0 CHECK (is_admin IN (0, 1)),
        is_superior INTEGER NOT NULL DEFAULT 0 CHECK (is_superior IN (0, 1)),
        FOREIGN KEY (genero_id) REFERENCES genero(id),
        FOREIGN KEY (cargo_id) REFERENCES cargo(id),
        FOREIGN KEY (superior_id) REFERENCES funcionario(id),
        FOREIGN KEY (rota_id) REFERENCES rota(id),
        FOREIGN KEY (hierarquia_id) REFERENCES hierarquia(id),
        FOREIGN KEY (endereco_id) REFERENCES endereco(id),
        FOREIGN KEY (funcao_id) REFERENCES funcao(id)
      );

      -- Tabela de Fotos de Funcionários
      CREATE TABLE IF NOT EXISTS funcionario_fotos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        funcionario_id TEXT NOT NULL,
        url TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_sync TEXT,
        FOREIGN KEY (funcionario_id) REFERENCES funcionario(id) ON DELETE CASCADE
      );

      -- Tabela de Emails
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

      -- Tabela de Telefones
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

      -- Tabela de Estoque
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

      -- Tabela de Pedidos
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
        tipo_pagamento TEXT DEFAULT 'dinheiro' 
        CHECK (tipo_pagamento IN ('dinheiro', 'boleto', 'cheque', 'vale', 'pix', 'cartao')),
        valor_unitario REAL,
        valor_total REAL,
        FOREIGN KEY (criado_por) REFERENCES funcionario(id),
        FOREIGN KEY (cliente_id) REFERENCES cliente(id),
        FOREIGN KEY (estoque_id) REFERENCES estoque(id)
      );

      -- Tabela de Entradas
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

      -- Tabela de Saídas
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
        tipo_pagamento TEXT DEFAULT 'dinheiro' CHECK (tipo_pagamento IN ('dinheiro', 'boleto', 'cheque', 'vale', 'pix', 'cartao')),
        valor_unitario REAL,
        valor_total REAL,
        FOREIGN KEY (estoque_id) REFERENCES estoque(id),
        FOREIGN KEY (cliente_id) REFERENCES cliente(id),
        FOREIGN KEY (veiculo_id) REFERENCES veiculo(id),
        FOREIGN KEY (funcionario_id) REFERENCES funcionario(id)
      );

      -- Tabela de Entregas
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
        tipo_pagamento TEXT DEFAULT 'dinheiro' CHECK (tipo_pagamento IN ('dinheiro', 'boleto', 'cheque', 'vale', 'pix', 'cartao')),
        valor_unitario REAL,
        valor_total REAL,
        FOREIGN KEY (veiculo_id) REFERENCES veiculo(id),
        FOREIGN KEY (estoque_id) REFERENCES estoque(id),
        FOREIGN KEY (cliente_id) REFERENCES cliente(id),
        FOREIGN KEY (funcionario_id) REFERENCES funcionario(id)
      );

      -- Tabela de Devoluções
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

      -- Tabela de Relatórios de Erro
      CREATE TABLE IF NOT EXISTS error_reports (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        device_info TEXT,
        app_version TEXT,
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_sync TEXT
      );

      -- Triggers para atualização de timestamps
      CREATE TRIGGER IF NOT EXISTS update_error_report_timestamp
      BEFORE UPDATE ON error_reports
      BEGIN
        UPDATE error_reports SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END;

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

      CREATE TRIGGER IF NOT EXISTS update_pedido_timestamp
      BEFORE UPDATE ON pedido
      BEGIN
        UPDATE pedido SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END;

      -- Triggers para gestão de estoque
      CREATE TRIGGER IF NOT EXISTS pedido_despachado
      AFTER UPDATE ON pedido
      WHEN NEW.status = 'despachado' AND OLD.status != 'despachado'
      BEGIN
        UPDATE estoque 
        SET quantidade = quantidade - NEW.quantidade,
            quantidade_reservada = quantidade_reservada - NEW.quantidade
        WHERE id = NEW.estoque_id;
      END;

      CREATE TRIGGER IF NOT EXISTS novo_pedido
      AFTER INSERT ON pedido
      WHEN NEW.status = 'pendente'
      BEGIN
        UPDATE estoque 
        SET quantidade_reservada = quantidade_reservada + NEW.quantidade
        WHERE id = NEW.estoque_id;
      END;

      CREATE TRIGGER IF NOT EXISTS pedido_cancelado
      AFTER UPDATE ON pedido
      WHEN NEW.status = 'cancelado' AND OLD.status != 'cancelado'
      BEGIN
        UPDATE estoque 
        SET quantidade_reservada = quantidade_reservada - NEW.quantidade
        WHERE id = NEW.estoque_id;
      END;

      CREATE TRIGGER IF NOT EXISTS depois_inserir_entrada
      AFTER INSERT ON entrada
      BEGIN
        UPDATE estoque 
        SET quantidade = quantidade + NEW.quantidade
        WHERE id = NEW.estoque_id;
      END;

      CREATE TRIGGER IF NOT EXISTS depois_inserir_devolucao
      AFTER INSERT ON devolucao
      BEGIN
        UPDATE estoque 
        SET quantidade = quantidade + NEW.quantidade
        WHERE id = NEW.estoque_id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_estoque_validade
      AFTER INSERT ON estoque
      WHEN NEW.data_validade IS NOT NULL AND date(NEW.data_validade) < date('now')
      BEGIN
        UPDATE estoque 
        SET disponivel_geral = 0
        WHERE id = NEW.id;
      END;

      CREATE TRIGGER IF NOT EXISTS check_estoque_disponivel
      BEFORE UPDATE ON estoque
      WHEN NEW.quantidade < NEW.quantidade_reservada
      BEGIN
        SELECT RAISE(ABORT, 'Quantidade reservada maior que disponível');
      END;

      CREATE TRIGGER IF NOT EXISTS entrega_realizada
      AFTER UPDATE ON entrega
      WHEN NEW.status = 'entregue' AND OLD.status != 'entregue'
      BEGIN
        -- 1. Atualiza o estoque
        UPDATE estoque 
        SET quantidade = quantidade - NEW.quantidade
        WHERE id = NEW.estoque_id;
        
        -- 2. Registra a saída
        INSERT INTO saida (
          tipo, origem_id, estoque_id, quantidade, cliente_id,
          veiculo_id, funcionario_id, motivo, nota
        ) VALUES (
          'entrega', NEW.id, NEW.estoque_id, NEW.quantidade, NEW.cliente_id,
          NEW.veiculo_id, NEW.funcionario_id, 'Entrega realizada', NEW.nota
        );
      END;

      CREATE TRIGGER IF NOT EXISTS devolucao_parcial
        AFTER UPDATE ON entrega
        WHEN NEW.status = 'devolucao_parcial' AND OLD.status != 'devolucao_parcial'
        BEGIN
          -- 1. Atualiza o estoque com a quantidade devolvida
          UPDATE estoque 
          SET quantidade = quantidade + NEW.quantidade_devolvida
          WHERE id = NEW.estoque_id;
          
          -- 2. Cria registro de devolução (REMOVA a referência a origin_id)
          INSERT INTO devolucao (
            id, estoque_id, quantidade, motivo, 
            data_devolucao, responsavel_id, observacao
          ) VALUES (
            (SELECT generateUUID()), 
            NEW.estoque_id, 
            NEW.quantidade_devolvida, 
            COALESCE(NEW.motivo_devolucao, 'Devolução parcial de entrega'),
            CURRENT_DATE,
            NEW.funcionario_id,
            CONCAT('Devolução parcial da entrega ', NEW.id)
          );
          
          -- 3. Atualiza a tabela saida (REMOVA a referência a origin_id)
          INSERT INTO saida (
            tipo, estoque_id, quantidade, cliente_id,
            veiculo_id, funcionario_id, motivo, nota
          ) VALUES (
            'entrega', 
            NEW.estoque_id, 
            (NEW.quantidade - NEW.quantidade_devolvida),
            NEW.cliente_id,
            NEW.veiculo_id, 
            NEW.funcionario_id, 
            CONCAT('Entrega parcial com devolução de ', NEW.quantidade_devolvida, ' itens'), 
            NEW.nota
          );
        END;

      -- Triggers para verificação de rotas
      CREATE TRIGGER IF NOT EXISTS antes_inserir_rota
      BEFORE INSERT ON rota
      BEGIN
        -- Verifica conflito de veículo
        SELECT CASE WHEN EXISTS (
          SELECT 1 FROM rota 
          WHERE veiculo_id = NEW.veiculo_id
          AND id <> NEW.id
          AND data_rota = NEW.data_rota
          AND status = 'em_andamento'
        ) THEN RAISE(ABORT, 'Veículo já está em outra rota nesta data') END;
        
        -- Verifica conflito de motorista
        SELECT CASE WHEN EXISTS (
          SELECT 1 FROM rota 
          WHERE funcionario_id = NEW.funcionario_id
          AND id <> NEW.id
          AND data_rota = NEW.data_rota
          AND status = 'em_andamento'
        ) THEN RAISE(ABORT, 'Motorista já está em outra rota nesta data') END;
      END;

      CREATE TRIGGER IF NOT EXISTS antes_atualizar_rota
      BEFORE UPDATE ON rota
      BEGIN
        -- Verifica conflito de veículo
        SELECT CASE WHEN EXISTS (
          SELECT 1 FROM rota 
          WHERE veiculo_id = NEW.veiculo_id
          AND id <> NEW.id
          AND data_rota = NEW.data_rota
          AND status = 'em_andamento'
        ) THEN RAISE(ABORT, 'Veículo já está em outra rota nesta data') END;
        
        -- Verifica conflito de motorista
        SELECT CASE WHEN EXISTS (
          SELECT 1 FROM rota 
          WHERE funcionario_id = NEW.funcionario_id
          AND id <> NEW.id
          AND data_rota = NEW.data_rota
          AND status = 'em_andamento'
        ) THEN RAISE(ABORT, 'Motorista já está em outra rota nesta data') END;
      END;
    `);

    console.log('Banco de dados inicializado com sucesso');
  }} catch (error) {
    operationQueue.forEach(op => op.reject(error));
    throw error;
  }
};
export const databaseService = {
  async executeQuery(sql, params = []) {
    if (!isInitialized) {
      throw new Error('Banco de dados não inicializado');
    }
    
    try {
      console.log(`Executando query: ${sql}`, params);
      
      // Para consultas SELECT, usamos getAllAsync
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const result = await db.getAllAsync(sql, params);
        console.log('Query SELECT executada com sucesso', result);
        return { rows: result }; // Padroniza o retorno para ter a propriedade rows
      } 
      // Para outras operações (INSERT, UPDATE, DELETE), usamos runAsync
      else {
        const result = await db.runAsync(sql, params);
        console.log('Query executada com sucesso', result);
        return result;
      }
    } catch (error) {
      console.error('Erro na query:', sql, error);
      throw error;
    }
  },
  /**
   * Insere um novo registro na tabela
   */
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

  /**
   * Busca registros em uma tabela
   */
  async select(table, where = '', params = [], orderBy = '', limit = '') {
    const whereClause = where ? `WHERE ${where}` : '';
    const orderClause = orderBy ? `ORDER BY ${orderBy}` : '';
    const limitClause = limit ? `LIMIT ${limit}` : '';
    const sql = `SELECT * FROM ${table} ${whereClause} ${orderClause} ${limitClause}`;
    
    try {
      const result = await this.executeQuery(sql, params);
      return { success: true, data: result.rows || [] }; // Ajuste aqui
    } catch (error) {
      return { success: false, error };
    }
  },

  /**
   * Atualiza registros em uma tabela
   */
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

  /**
   * Remove registros de uma tabela
   */
  async delete(table, where, params = []) {
    const sql = `DELETE FROM ${table} WHERE ${where}`;
    
    try {
      const result = await this.executeQuery(sql, params);
      return { success: true, changes: result.changes };
    } catch (error) {
      return { success: false, error };
    }
  },

  /**
   * Insere um registro com UUID como ID
   */
  async insertWithUUID(table, data) {
    const id = this.generateUUID();
    const result = await this.insert(table, { id, ...data });
    return { ...result, id };
  },

  /**
   * Obtém a última data de sincronização de uma tabela
   */
  async getLastSync(table) {
    try {
      // Verifica se a tabela existe
      const tableCheck = await this.executeQuery(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`, 
        [table]
      );
      
      if (!tableCheck.rows || tableCheck.rows.length === 0) {
        console.warn(`Tabela ${table} não existe`);
        return null;
      }

      // Verifica se a coluna last_sync existe
      const columnCheck = await this.executeQuery(
        `PRAGMA table_info(${table})`
      );
      
      const hasLastSync = columnCheck.rows.some(col => col.name === 'last_sync');
      
      if (!hasLastSync) {
        console.warn(`Coluna last_sync não existe na tabela ${table}`);
        return null;
      }

      const result = await this.executeQuery(
        `SELECT last_sync FROM ${table} ORDER BY last_sync DESC LIMIT 1`
      );
      
      return result.rows?.length > 0 ? result.rows.item(0).last_sync : null;
    } catch (error) {
      console.error(`Erro ao obter last_sync para tabela ${table}:`, error);
      return null;
    }
  },

  /**
   * Atualiza a data de sincronização para uma tabela
   */
  async updateLastSync(table, date = new Date().toISOString()) {
    try {
      // Verifica se a tabela tem a coluna last_sync
      const columnCheck = await this.executeQuery(
        `PRAGMA table_info(${table})`
      );
      
      const hasLastSync = columnCheck.rows.some(col => col.name === 'last_sync');
      
      if (!hasLastSync) {
        console.warn(`Coluna last_sync não existe na tabela ${table}`);
        return false;
      }

      await this.executeQuery(
        `UPDATE ${table} SET last_sync = ?`,
        [date]
      );
      
      return true;
    } catch (error) {
      console.error(`Erro ao atualizar last_sync para tabela ${table}:`, error);
      return false;
    }
  },

  /**
   * Obtém registros que precisam ser sincronizados
   */
  async getUnsyncedRecords(table) {
    try {
      const result = await this.executeQuery(
        `SELECT * FROM ${table} WHERE last_sync IS NULL OR updated_at > last_sync`
      );
      return result.rows || []; // Ajuste aqui
    } catch (error) {
      console.error(`Erro ao buscar registros não sincronizados de ${table}:`, error);
      return [];
    }
  },

  /**
   * Gera um UUID v4
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  /**
   * Verifica se uma tabela existe
   */
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

  /**
   * Obtém informações sobre as colunas de uma tabela
   */
  async getTableColumns(tableName) {
    try {
      const result = await this.executeQuery(`PRAGMA table_info(${tableName})`);
      return result.rows ? result : [];
    } catch (error) {
      console.error(`Erro ao obter colunas da tabela ${tableName}:`, error);
      return [];
    }
  },

  /**
   * Executa uma transação
   */
  async transaction(operations) {
    try {
      await db.execAsync('BEGIN TRANSACTION');
      
      try {
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
    } catch (error) {
      return { success: false, error };
    }
  }
};

/**
 * Obtém a instância do banco de dados
 */
export const getDbInstance = () => db;

/**
 * Fecha a conexão com o banco de dados
 */
export const closeDatabase = async () => {
  if (db) {
    await db.closeAsync();
    db = null;
    console.log('Conexão com o banco de dados fechada');
  }
};

/**
 * Deleta o banco de dados (apenas para desenvolvimento)
 */
export const deleteDatabase = async () => {
  if (db) {
    await db.closeAsync();
    await SQLite.deleteDatabaseAsync('localDatabase.db');
    db = null;
    console.log('Banco de dados deletado');
  }
};