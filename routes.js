import CadastroUserScreen from './screens/cadastroUser';
import ErrorScreen from './screens/Error';
import EsqueciMinhaSenhaScreen from './screens/esqueciMinhaSenha';
import LoginScreen from './screens/Login';

import MenuCadastroScreen from './screens/menuCadastro1';
import MenuPrincipalADMScreen from './screens/menuPrincipalADM';
import MenuPrincipalEXPScreen from './screens/menuPrincipalEXP';
import MenuPrincipalMTRScreen from './screens/menuPrincipalMTR';
import MenuPrincipalPDOScreen from './screens/menuPrincipalPDO';
import TelaInicialScreen from './screens/TelaInicial';

import BalancoScreen from './screens/Entidades/Balanco';
import ClientesScreen from './screens/Entidades/Clientes';
import ClientesScreenMTR from './screens/Entidades/ClientesMTR';
import DevolucaoScreen from './screens/Entidades/Devolucao';
import DevolucaoScreen1 from './screens/Entidades/Devolucao1';
import EntradasScreen from './screens/Entidades/Entradas';
import EntradasScreen1 from './screens/Entidades/Entradas1';
import EntregasScreen from './screens/Entidades/Entregas';
import EntregasScreen1 from './screens/Entidades/Entregas1';
import EntregasScreenMTR from './screens/Entidades/EntregasMTR';
import EntregasScreenPDO from './screens/Entidades/EntregasPDO';
import EstoqueScreen from './screens/Entidades/Estoque';
import EstoqueScreen1 from './screens/Entidades/Estoque1';
import EstoqueScreenPDO from './screens/Entidades/EstoquePDO';
import FuncionariosScreen from './screens/Entidades/funcionarios';
import FuncoesScreen from './screens/Entidades/Funcoes';
import PedidosScreen from './screens/Entidades/Pedidos';
import PedidosScreenPDO from './screens/Entidades/PedidosPDO';
import RotasScreen from './screens/Entidades/Rotas';
import RotasScreenMTR from './screens/Entidades/RotasMTR';
import SaidasScreen from './screens/Entidades/Saidas';
import SaidasScreen1 from './screens/Entidades/Saidas1';
import VeiculosScreen from './screens/Entidades/Veiculos';
import VeiculosScreenMTR from './screens/Entidades/VeiculosMTR';

import CadastroBalanco from './screens/Entidades/Cadastros/cadastroBalanco';
import CadastroClientes from './screens/Entidades/Cadastros/cadastroClientes';
import CadastroDevolucoes from './screens/Entidades/Cadastros/cadastroDevolucoes';
import CadastroEntrada from './screens/Entidades/Cadastros/cadastroEntradas';
import CadastroEntrega from './screens/Entidades/Cadastros/cadastroEntregas';
import CadastroEstoque from './screens/Entidades/Cadastros/cadastroEstoque';
import CadastroFuncoes from './screens/Entidades/Cadastros/cadastroFuncoes';
import CadastroPedidos from './screens/Entidades/Cadastros/cadastroPedidos';
import CadastroRotas from './screens/Entidades/Cadastros/cadastroRotas';
import CadastroSaida from './screens/Entidades/Cadastros/cadastroSaidas';
import CadastroVeiculos from './screens/Entidades/Cadastros/cadastroVeiculos';




export const USER_ROLES = {
  ADMIN: 1,      
  EXPEDICAO: 2,  
  PRODUCAO: 3,  
  MOTORISTA: 4   
};

export const PUBLIC_ROUTES = [
  { name: 'TelaInicial', component: TelaInicialScreen },
  { name: 'Login', component: LoginScreen },
  { name: 'CadastroUser', component: CadastroUserScreen },
  { name: 'EsqueciMinhaSenha', component: EsqueciMinhaSenhaScreen }
];

export const CADASTRO_ROUTES = [
  { name: 'CadastroEstoque', component: CadastroEstoque },
  { name: 'CadastroClientes', component: CadastroClientes },
  { name: 'CadastroEntrega', component: CadastroEntrega },
  { name: 'CadastroEntrada', component: CadastroEntrada },
  { name: 'CadastroSaida', component: CadastroSaida },
  { name: 'CadastroVeiculos', component: CadastroVeiculos },
  { name: 'CadastroRotas', component: CadastroRotas },
  { name: 'CadastroPedidos', component: CadastroPedidos },
  { name: 'CadastroFuncoes', component: CadastroFuncoes },
  { name: 'CadastroDevolucoes', component: CadastroDevolucoes },
  { name: 'CadastroBalanco', component: CadastroBalanco }
];

export const PROTECTED_ROUTES = [
  { name: 'MenuCadastro', component: MenuCadastroScreen },
  { name: 'MenuPrincipalADM', component: MenuPrincipalADMScreen },
  { name: 'MenuPrincipalEXP', component: MenuPrincipalEXPScreen },
  { name: 'MenuPrincipalPDO', component: MenuPrincipalPDOScreen },
  { name: 'MenuPrincipalMTR', component: MenuPrincipalMTRScreen },
  { name: 'Error', component: ErrorScreen },

  { name: 'Estoque', component: EstoqueScreen },
  { name: 'Estoque1', component: EstoqueScreen1 },
  { name: 'EstoquePDO', component: EstoqueScreenPDO },
  { name: 'Entregas', component: EntregasScreen },
  { name: 'Entregas1', component: EntregasScreen1 },
  { name: 'EntregasMTR', component: EntregasScreenMTR },
  { name: 'EntregasPDO', component: EntregasScreenPDO },
  { name: 'Saidas', component: SaidasScreen },
  { name: 'Saidas1', component: SaidasScreen1 },
  { name: 'Balanco', component: BalancoScreen },
  { name: 'Veiculos', component: VeiculosScreen },
  { name: 'VeiculosMTR', component: VeiculosScreenMTR },
  { name: 'ClientesMTR', component: ClientesScreenMTR },
  { name: 'Clientes', component: ClientesScreen },
  { name: 'Funcionarios', component: FuncionariosScreen },
  { name: 'Funcoes', component: FuncoesScreen },
  { name: 'Rotas', component: RotasScreen },
  { name: 'RotasMTR', component: RotasScreenMTR },
  { name: 'Pedidos', component: PedidosScreen },
  { name: 'PedidosPDO', component: PedidosScreenPDO },
  { name: 'Entradas', component: EntradasScreen },
  { name: 'Entradas1', component: EntradasScreen1 },
  { name: 'Devolucao', component: DevolucaoScreen },
  { name: 'Devolucao1', component: DevolucaoScreen1 },
];

export const getRequiredRole = (screenName) => {
  if (screenName.endsWith('1')) return USER_ROLES.EXPEDICAO;
  if (screenName.endsWith('PDO')) return USER_ROLES.PRODUCAO;
  if (screenName.endsWith('MTR')) return USER_ROLES.MOTORISTA;
  return USER_ROLES.ADMIN;
};