import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#844a05',
  },
  header: {
    height: 120,
    backgroundColor: '#043b57',
    width: '100%',
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 150,
    height: 100,
  },
  alerta: {
    width: 80,
    height: 70,
    marginRight: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  button: {
    backgroundColor: '#fadb53',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#043b57',
  },
  itemContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  itemBox: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    marginTop: 10,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#043b57',
    flex: 1,
  },
  itemDate: {
    fontSize: 14,
    color: '#666',
  },
  deleteIconButton: {
    backgroundColor: '#d9534f',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteIconText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  expandedContent: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  itemDetail: {
    fontSize: 16,
    marginVertical: 3,
    color: '#444',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    padding: 8,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: '#043b57',
  },
  deleteButton: {
    backgroundColor: '#d9534f',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#fff',
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  editButton: {
  backgroundColor: '#FFA500', // Laranja para diferenciar do visualizar
},
itemSubtitle: {
  fontSize: 14,
  color: '#666',
  marginRight: 10,
},
// Adicione no seu EstilosdeEntidade.js
checkIcon: {
  color: '#4CAF50', // Verde para "Sim"
},
xIcon: {
  color: '#F44336', // Vermelho para "Não"
},
// Adicione ao seu EstilosdeEntidade.js
itemQuantity: {
  fontWeight: 'bold',
  fontSize: 16,
  color: '#043b57',
},
checkIcon: {
  color: '#4CAF50',
  fontWeight: 'bold',
},
xIcon: {
  color: '#F44336',
  fontWeight: 'bold',
},
statusText: {
  fontWeight: 'bold',
  marginVertical: 3,
},
itemStatus: {
  color: '#F44336',
  fontSize: 12,
  fontWeight: 'bold',
  marginTop: 2
},
itemQuantity: {
  fontWeight: 'bold',
  fontSize: 16
},
actionButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 10,
  gap: 8
},
actionButton: {
  flex: 1,
  padding: 8,
  borderRadius: 4,
  alignItems: 'center'
},
viewButton: {
  backgroundColor: '#2196F3'
},
editButton: {
  backgroundColor: '#FFC107'
},
deleteButton: {
  backgroundColor: '#F44336'
},
actionButtonText: {
  color: 'white',
  fontWeight: 'bold'
},
funcionarioFoto: {
  width: 50,
  height: 50,
  borderRadius: 25,
  marginRight: 10
},
detailRow: {
  flexDirection: 'row',
  marginBottom: 5
},
detailLabel: {
  fontWeight: 'bold',
  width: 120,
  color: '#555'
},
detailValue: {
  flex: 1
},
activeStatus: {
  color: '#4CAF50'
},
inactiveStatus: {
  color: '#F44336'
},
adminBadge: {
  backgroundColor: '#043b57',
  color: 'white',
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 4,
  fontSize: 12,
  marginTop: 4
},
actionButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 10,
  gap: 8
},
actionButton: {
  flex: 1,
  padding: 8,
  borderRadius: 4,
  alignItems: 'center'
},
viewButton: {
  backgroundColor: '#2196F3'
},
editButton: {
  backgroundColor: '#FFC107'
},
deleteButton: {
  backgroundColor: '#F44336'
},
actionButtonText: {
  color: 'white',
  fontWeight: 'bold'
},tabContainer: {
  flexDirection: 'row',
  marginBottom: 15,
  borderBottomWidth: 1,
  borderBottomColor: '#ddd'
},
tabButton: {
  flex: 1,
  paddingVertical: 12,
  alignItems: 'center',
  borderBottomWidth: 3,
  borderBottomColor: 'transparent'
},
tabButtonActive: {
  borderBottomColor: '#043b57'
},
tabButtonText: {
  color: '#666',
  fontWeight: 'bold'
},
tabButtonTextActive: {
  color: '#043b57'
},
itemActions: {
  flexDirection: 'row',
  alignItems: 'center'
},
actionText: {
  color: '#2196F3',
  fontWeight: 'bold'
},
dispatchButton: {
  backgroundColor: '#4CAF50'
},
prepareButton: {
  backgroundColor: '#2196F3'
},
cancelButton: {
  backgroundColor: '#F44336'
},
checkIcon: {
  color: '#4CAF50',
  fontWeight: 'bold'
},
xIcon: {
  color: '#F44336',
  fontWeight: 'bold'
},
startButton: {
  backgroundColor: '#2196F3'
},
completeButton: {
  backgroundColor: '#4CAF50'
},
cancelButton: {
  backgroundColor: '#F44336'
},
actionButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 10,
  gap: 8
},
actionButton: {
  flex: 1,
  padding: 8,
  borderRadius: 4,
  alignItems: 'center'
},
actionButtonText: {
  color: 'white',
  fontWeight: 'bold'
},
itemContainer: {
  marginBottom: 10
},
itemBox: {
  backgroundColor: '#fff',
  padding: 15,
  borderRadius: 8,
  elevation: 2
},
itemHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center'
},
itemTitle: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#043b57'
},
itemSubtitle: {
  fontSize: 14,
  color: '#666'
},
expandedContent: {
  marginTop: 10,
  paddingTop: 10,
  borderTopWidth: 1,
  borderTopColor: '#eee'
},
itemDetail: {
  fontSize: 14,
  marginBottom: 5,
  color: '#444'
},
actionButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 15,
  gap: 10
},
actionButton: {
  padding: 10,
  borderRadius: 5,
  alignItems: 'center',
  flex: 1
},
actionButtonText: {
  color: 'white',
  fontWeight: 'bold'
},
startButton: {
  backgroundColor: '#2196F3'
},
completeButton: {
  backgroundColor: '#4CAF50'
},
cancelButton: {
  backgroundColor: '#F44336'
},
viewButton: {
  backgroundColor: '#043b57'
},
emptyText: {
  textAlign: 'center',
  marginTop: 20,
  color: '#666'
},
headerRightActions: {
  flexDirection: 'row',
  alignItems: 'center',
},
dataSourceToggle: {
  marginRight: 15,
  padding: 5,
  backgroundColor: '#f0f0f0',
  borderRadius: 5,
},
dataSourceText: {
  fontSize: 12,
  color: '#043b57',
},
detailRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 5,
},
detailLabel: {
  fontWeight: 'bold',
  color: '#555',
},
detailValue: {
  flex: 1,
  marginLeft: 10,
  textAlign: 'right',
},
itemStatus: {
  color: '#F44336',
  fontSize: 12,
  fontWeight: 'bold',
},
headerRightActions: {
  flexDirection: 'row',
  alignItems: 'center',
},
dataSourceToggle: {
  marginRight: 15,
  padding: 5,
  backgroundColor: '#f0f0f0',
  borderRadius: 5,
},
dataSourceText: {
  fontSize: 12,
  color: '#043b57',
},
funcionarioFoto: {
  width: 50,
  height: 50,
  borderRadius: 25,
  marginRight: 10,
},
detailSection: {
  marginBottom: 15,
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
  paddingBottom: 10,
},
sectionTitle: {
  fontWeight: 'bold',
  color: '#043b57',
  marginBottom: 8,
  fontSize: 16,
},
detailRow: {
  flexDirection: 'row',
  marginBottom: 5,
},
detailLabel: {
  fontWeight: 'bold',
  width: 120,
  color: '#555',
},
detailValue: {
  flex: 1,
},
itemStatus: {
  fontSize: 12,
  fontWeight: 'bold',
  paddingVertical: 2,
  paddingHorizontal: 6,
  borderRadius: 10,
},
activeStatus: {
  backgroundColor: '#e8f5e9',
  color: '#2e7d32',
},
inactiveStatus: {
  backgroundColor: '#ffebee',
  color: '#c62828',
},
adminBadge: {
  backgroundColor: '#bbdefb',
  color: '#0d47a1',
  fontSize: 10,
  fontWeight: 'bold',
  paddingVertical: 2,
  paddingHorizontal: 6,
  borderRadius: 10,
  marginTop: 4,
},
headerRightActions: {
  flexDirection: 'row',
  alignItems: 'center',
},
dataSourceToggle: {
  marginRight: 15,
  padding: 5,
  backgroundColor: '#f0f0f0',
  borderRadius: 5,
},
dataSourceText: {
  fontSize: 12,
  color: '#043b57',
},
tabContainer: {
  flexDirection: 'row',
  marginBottom: 15,
  borderBottomWidth: 1,
  borderBottomColor: '#ddd',
},
tabButton: {
  flex: 1,
  paddingVertical: 12,
  alignItems: 'center',
  borderBottomWidth: 2,
  borderBottomColor: 'transparent',
},
tabButtonActive: {
  borderBottomColor: '#043b57',
},
tabButtonText: {
  color: '#666',
  fontWeight: 'bold',
},
tabButtonTextActive: {
  color: '#043b57',
},
itemActions: {
  flexDirection: 'row',
  alignItems: 'center',
},
actionText: {
  color: '#043b57',
  fontWeight: 'bold',
},
headerRightActions: {
  flexDirection: 'row',
  alignItems: 'center',
},
dataSourceToggle: {
  marginRight: 15,
  padding: 5,
  backgroundColor: '#f0f0f0',
  borderRadius: 5,
},
dataSourceText: {
  fontSize: 12,
  color: '#043b57',
},
detailRow: {
  flexDirection: 'row',
  marginBottom: 8,
},
detailLabel: {
  fontWeight: 'bold',
  width: 100,
  color: '#555',
},
detailValue: {
  flex: 1,
},
prepareButton: {
  backgroundColor: '#2196F3',
},
dispatchButton: {
  backgroundColor: '#4CAF50',
},
cancelButton: {
  backgroundColor: '#F44336',
},
headerRightActions: {
  flexDirection: 'row',
  alignItems: 'center',
},
dataSourceToggle: {
  marginRight: 15,
  padding: 5,
  backgroundColor: '#f0f0f0',
  borderRadius: 5,
},
dataSourceText: {
  fontSize: 12,
  color: '#043b57',
},
detailRow: {
  flexDirection: 'row',
  marginBottom: 8,
},
detailLabel: {
  fontWeight: 'bold',
  width: 120,
  color: '#555',
},
detailValue: {
  flex: 1,
},
startButton: {
  backgroundColor: '#2196F3',
},
completeButton: {
  backgroundColor: '#4CAF50',
},
cancelButton: {
  backgroundColor: '#F44336',
},
headerRightActions: {
  flexDirection: 'row',
  alignItems: 'center',
},
dataSourceToggle: {
  marginRight: 15,
  padding: 5,
  backgroundColor: '#f0f0f0',
  borderRadius: 5,
},
dataSourceText: {
  fontSize: 12,
  color: '#043b57',
},
detailRow: {
  flexDirection: 'row',
  marginBottom: 8,
},
detailLabel: {
  fontWeight: 'bold',
  width: 120,
  color: '#555',
},
detailValue: {
  flex: 1,
},
checkIcon: {
  color: '#4CAF50',
},
xIcon: {
  color: '#F44336',
},
deleteButton: {
  backgroundColor: '#F44336',
},
headerRightActions: {
  flexDirection: 'row',
  alignItems: 'center',
},
dataSourceToggle: {
  marginRight: 15,
  padding: 5,
  backgroundColor: '#f0f0f0',
  borderRadius: 5,
},
dataSourceText: {
  fontSize: 12,
  color: '#043b57',
},
filtroInputContainer: {
  flexDirection: 'row', // Alinha os filhos na horizontal
  alignItems: 'center', // Alinha verticalmente no centro (opcional)
  backgroundColor: '#fff',
  borderRadius: 10,
  height: 40,
  paddingHorizontal: 10,
  borderWidth: 1,
  borderColor: '#ccc',
  marginBottom:5,
},

filtroIcon: {
  width: 20,
  height: 20,
  marginRight: 8,
},

filtroInput: {
  flex: 1, // Ocupa o espaço restante
  fontSize: 16,
  color: '#000',
},
filtroLabel:{
  fontSize: 19,
  color: '#000',
  marginRight: 10,
},
scrollContent: {
  padding: 20,
  paddingBottom: 40,
  backgroundColor: '#844a05', // para combinar com container
},
section: {
  backgroundColor: '#fadb53',
  borderRadius: 15,
  padding: 20,
  marginBottom: 20,
  borderWidth: 1,
  borderColor: '#ccc',
},
label: {
  marginBottom: 8,
  color: '#043b57',
  fontWeight: 'bold',
},
input: {
  backgroundColor: 'white',
  marginBottom: 15,
  color: '#043b57',
  borderRadius: 5,
  paddingHorizontal: 10,
  minHeight: 50,
  borderColor: '#043b57',
  borderWidth: 1,
},
buttonTextInput: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#000',
  },
buttonEditar: {
    backgroundColor: '#14721d',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  navbarFiltro: {
    marginVertical: 10,
  },
  filtroLabel: {
    fontWeight: 'bold',
    color: '#043b57',
    marginBottom: 5,
  },
  filtroInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10,
    height: 40,
  },
  filtroIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  filtroInput: {
    flex: 1,
    fontSize: 16,
    color: '#043b57',
  },

  // LISTA DE ITENS
  itemContainer: {
    marginBottom: 10,
  },
  itemBox: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#043b57',
  },
  deleteIconButton: {
    padding: 5,
    backgroundColor: '#f44336',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIconText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  expandedContent: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingTop: 10,
  },
  itemDetail: {
    fontSize: 14,
    color: '#043b57',
    marginBottom: 4,
  },

  // AÇÕES (botões no item expandido)
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 25,
    marginLeft: 10,
  },
  viewButton: {
    backgroundColor: '#043b57',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  // FlatList
  listContent: {
    paddingBottom: 20,
  },

  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },

  // BOTÃO FILTRO ATIVO/INATIVO NO MODAL (filtro 3 pontinhos)
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  filterButtonActive: {
    backgroundColor: '#043b57',
  },
  filterButtonText: {
    fontWeight: 'bold',
    color: '#000',
  },

  // Você pode usar o filtro ativo para mudar a cor do texto também:
  filterButtonActiveText: {
    color: '#fff',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
    justifyContent: 'flex-start',
  },
  radioButton: {
    borderWidth: 1,
    borderColor: '#043b57',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'white',
  },
  radioButtonSelected: {
    backgroundColor: '#043b57',
  },
  radioText: {
    color: '#043b57',
    fontWeight: 'bold',
    fontSize: 14,
  },
  radioTextSelected: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  checkboxRow: {
    marginBottom: 6,
  },
   actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    flexWrap: 'wrap',
  },

  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginVertical: 4,
    minWidth: 100,
    alignItems: 'center',
  },

  viewButton: {
    backgroundColor: '#2a7ad9', // azul
  },

  addButton: {
    backgroundColor: '#28a745', // verde
  },

  deleteButton: {
    backgroundColor: '#dc3545', // vermelho
  },

  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // Modal (opcional)
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalLabel: {
    fontWeight: 'bold',
  },
  pickerContainer: {
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 5,
  marginBottom: 15,
  overflow: 'hidden',
},
});

export default styles;