import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Checkbox, Text, TextInput } from 'react-native-paper';
import { supabase } from '../../../contexts/supabaseClient';
import { databaseService } from '../../../services/localDatabase';

export default function CadastroFuncoes({ navigation, route }) {
  const { tipo, id } = route.params || {}; // tipo: 'cargo' ou 'funcao'
  const tiposFuncao = [
    { id: 1, nome: 'Motorista' },
    { id: 2, nome: 'Entregador' },
    { id: 3, nome: 'Gerente' },
    { id: 4, nome: 'Administrativo' }
  ];

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    nivelHierarquia: '',
    tipoFuncao: null,
    permissoes: []
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);

  // Carrega dados se for edição
  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from(tipo)
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;
          if (data) {
            setFormData({
              nome: data.nome,
              descricao: data.descricao || '',
              nivelHierarquia: data.nivel_hierarquia || '',
              tipoFuncao: data.tipo || null,
              permissoes: data.permissoes ? JSON.parse(data.permissoes) : []
            });
            setIsEditMode(true);
          }
        } catch (error) {
          Alert.alert('Erro', 'Não foi possível carregar os dados');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [id, tipo]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nome.trim()) newErrors.nome = 'Campo obrigatório';
    if (formData.nome.trim().length > 100) newErrors.nome = 'Máximo 100 caracteres';
    if (tipo === 'funcao') {
      if (!formData.nivelHierarquia) newErrors.nivelHierarquia = 'Campo obrigatório';
      if (!formData.tipoFuncao) newErrors.tipoFuncao = 'Campo obrigatório';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const dataToSave = {
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || null,
        ...(tipo === 'funcao' && {
          nivel_hierarquia: formData.nivelHierarquia,
          tipo: formData.tipoFuncao,
          permissoes: JSON.stringify(formData.permissoes)
        })
      };

      const tableName = tipo === 'cargo' ? 'cargo' : 'funcao';
      const state = await NetInfo.fetch();

      if (isEditMode) {
        // Atualização
        if (state.isConnected) {
          const { error } = await supabase
            .from(tableName)
            .update(dataToSave)
            .eq('id', id);
          if (error) throw error;
        } else {
          await databaseService.updateById(tableName, id, dataToSave);
        }
        Alert.alert('Sucesso', `${tipo === 'cargo' ? 'Cargo' : 'Função'} atualizado com sucesso!`);
      } else {
        // Inserção
        if (state.isConnected) {
          const { error } = await supabase
            .from(tableName)
            .insert([dataToSave]);
          if (error) throw error;
        } else {
          await databaseService.insertWithUUID(tableName, dataToSave);
        }
        Alert.alert('Sucesso', `${tipo === 'cargo' ? 'Cargo' : 'Função'} cadastrado com sucesso!`);
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', error.message || 'Falha ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#043b57" barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image 
              source={require('../../../Assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Error')}>
            <Image 
              source={require('../../../Assets/alerta.png')} 
              style={styles.alerta}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isEditMode ? 'EDITAR' : 'CADASTRAR'} {tipo === 'cargo' ? 'CARGO' : 'FUNÇÃO'}
          </Text>
          
          <TextInput
            label={`Nome ${tipo === 'cargo' ? 'do Cargo' : 'da Função'}*`}
            value={formData.nome}
            onChangeText={text => {
              setFormData({...formData, nome: text});
              if (errors.nome) setErrors({...errors, nome: null});
            }}
            style={styles.input}
            error={!!errors.nome}
            maxLength={100}
          />
          {errors.nome && <Text style={styles.errorText}>{errors.nome}</Text>}

          <TextInput
            label="Descrição"
            value={formData.descricao}
            onChangeText={text => setFormData({...formData, descricao: text})}
            style={styles.input}
            multiline
            numberOfLines={3}
            maxLength={255}
          />

          {tipo === 'funcao' && (
            <>
              <Text style={styles.label}>Nível de Hierarquia *</Text>
              <TextInput
                value={formData.nivelHierarquia}
                onChangeText={text => setFormData({...formData, nivelHierarquia: text})}
                style={styles.input}
                keyboardType="numeric"
                error={!!errors.nivelHierarquia}
              />
              {errors.nivelHierarquia && <Text style={styles.errorText}>{errors.nivelHierarquia}</Text>}

              <Text style={styles.label}>Tipo de Função *</Text>
              <View style={styles.pickerContainer}>
                {tiposFuncao.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.pickerOption,
                      formData.tipoFuncao === item.id && styles.pickerOptionSelected
                    ]}
                    onPress={() => setFormData({...formData, tipoFuncao: item.id})}
                  >
                    <Text style={formData.tipoFuncao === item.id ? styles.pickerTextSelected : styles.pickerText}>
                      {item.nome}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.tipoFuncao && <Text style={styles.errorText}>{errors.tipoFuncao}</Text>}

              <Text style={styles.label}>Permissões</Text>
              {['create', 'read', 'update', 'delete'].map(permissao => (
                <View key={permissao} style={styles.checkboxRow}>
                  <Checkbox
                    status={formData.permissoes.includes(permissao) ? 'checked' : 'unchecked'}
                    onPress={() => {
                      const updated = formData.permissoes.includes(permissao)
                        ? formData.permissoes.filter(p => p !== permissao)
                        : [...formData.permissoes, permissao];
                      setFormData({...formData, permissoes: updated});
                    }}
                    color="#043b57"
                  />
                  <Text style={styles.checkboxLabel}>
                    {permissao.charAt(0).toUpperCase() + permissao.slice(1)}
                  </Text>
                </View>
              ))}
            </>
          )}

          <Button 
            mode="contained" 
            onPress={handleSubmit}
            style={styles.registerButton}
            labelStyle={styles.buttonLabel}
            loading={loading}
            disabled={loading}
          >
            {loading ? 'SALVANDO...' : isEditMode ? 'ATUALIZAR' : 'CADASTRAR'}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#844a05',
  },
  header: {
    height: 120,
    backgroundColor: '#043b57',
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#fadb53',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#043b57',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'white',
    marginBottom: 15,
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    fontSize: 12,
  },
  registerButton: {
    backgroundColor: '#043b57',
    marginTop: 20,
    paddingVertical: 5,
    borderRadius: 25,
  },
  buttonLabel: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  label: {
    marginBottom: 8,
    color: '#043b57',
    fontWeight: 'bold',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  pickerOption: {
    borderWidth: 1,
    borderColor: '#043b57',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    marginBottom: 10,
  },
  pickerOptionSelected: {
    backgroundColor: '#043b57',
  },
  pickerText: {
    color: '#043b57',
  },
  pickerTextSelected: {
    color: 'white',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkboxLabel: {
    marginLeft: 8,
    color: '#043b57',
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#043b57',
    marginTop: 10,
    marginBottom: 15,
  },
});