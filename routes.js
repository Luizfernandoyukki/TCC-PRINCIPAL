import CadastroUserScreen from './screens/cadastroUser';
import ErrorScreen from './screens/Error';
import EsqueciMinhaSenhaScreen from './screens/esqueciMinhaSenha';
import LoginScreen from './screens/Login';

import MenuPrincipalADMScreen from './screens/menuPrincipalADM';
import MenuPrincipalEXPScreen from './screens/menuPrincipalEXP';
import MenuPrincipalMTRScreen from './screens/menuPrincipalMTR';
import MenuPrincipalPDOScreen from './screens/menuPrincipalPDO';
import TelaInicialScreen from './screens/TelaInicial';

import BalancoScreen from './screens/Entidades/Balanco';
import ClientesScreen from './screens/Entidades/Clientes';
import ClientesScreenMTR from './screens/Entidades/ClientesMTR';
import DespachoScreen from './screens/Entidades/Despacho';
import Despacho1Screen from './screens/Entidades/Despacho1';
import DevolucaoScreen from './screens/Entidades/Devolucao';
import DevolucaoScreen1 from './screens/Entidades/Devolucao1';
import EntradasScreen from './screens/Entidades/Entradas';
import EntradasScreen1 from './screens/Entidades/Entradas1';
import EntregarScreen from './screens/Entidades/EntregarMTR';
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
import SaidasScreen from './screens/Entidades/Saidas';
import SaidasScreen1 from './screens/Entidades/Saidas1';
import VeiculosScreen from './screens/Entidades/Veiculos';
import VeiculosScreenMTR from './screens/Entidades/VeiculosMTR';

import CadastroBalanco from './screens/Entidades/Cadastros/cadastroBalanco';
import CadastroClientes from './screens/Entidades/Cadastros/cadastroClientes';
import CadastroDespacho from './screens/Entidades/Cadastros/cadastroDespacho';
import CadastroDevolucoes from './screens/Entidades/Cadastros/cadastroDevolucoes';
import CadastroEntrada from './screens/Entidades/Cadastros/cadastroEntradas';
/*import CadastroEntregar from './screens/Entidades/Cadastros/cadastroEntregar';*/
import CadastroEntrega from './screens/Entidades/Cadastros/cadastroEntregas';
import CadastroEstoque from './screens/Entidades/Cadastros/cadastroEstoque';
import CadastroFuncionariosScreen from './screens/Entidades/Cadastros/cadastroFuncionario';
import CadastroFuncoes from './screens/Entidades/Cadastros/cadastroFuncoes';
import CadastroPedidos from './screens/Entidades/Cadastros/cadastroPedidos';
import CadastroSaida from './screens/Entidades/Cadastros/cadastroSaidas';
import CadastroVeiculos from './screens/Entidades/Cadastros/cadastroVeiculos';



import EditarClienteScreen from './screens/Entidades/Editar/EditarCliente';
/*import EditarDespacho from './screens/Entidades/Editar/EditarDespacho';*/
import EditarentregaScreen from './screens/Entidades/Editar/EditarEntrega';
import EditarEstoqueScreen from './screens/Entidades/Editar/EditarEstoque';
import EditarFuncionarioScreen from './screens/Entidades/Editar/EditarFuncionario';

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
  {name: 'CadastroDespacho', component: CadastroDespacho},
  /*{name: 'CadastroEntregar', component: CadastroEntregar},*/
  { name: 'CadastroPedidos', component: CadastroPedidos },
  { name: 'CadastroFuncoes', component: CadastroFuncoes },
  { name: 'CadastroDevolucoes', component: CadastroDevolucoes },
  { name: 'CadastroBalanco', component: CadastroBalanco },
  {name: 'CadastroFuncionarios', component: CadastroFuncionariosScreen},
];

export const PROTECTED_ROUTES = [
  { name: 'MenuPrincipalADM', component: MenuPrincipalADMScreen },
  { name: 'MenuPrincipalEXP', component: MenuPrincipalEXPScreen },
  { name: 'MenuPrincipalPDO', component: MenuPrincipalPDOScreen },
  { name: 'MenuPrincipalMTR', component: MenuPrincipalMTRScreen },
  { name: 'Error', component: ErrorScreen },

  {name: 'EditarEstoque', component: EditarEstoqueScreen},
  {name: 'EditarFuncionario', component: EditarFuncionarioScreen},
  {name: 'EditarEntrega', component: EditarentregaScreen},
  {name: 'EditarCliente',  component: EditarClienteScreen},
  /*{name: 'EditarDespacho', component: EditarDespacho},*/

  { name: 'Estoque', component: EstoqueScreen },
  {name:'Despacho', component: DespachoScreen },
  {name:'Despacho1', component: Despacho1Screen },
  {name:'Entregar', component: EntregarScreen},
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