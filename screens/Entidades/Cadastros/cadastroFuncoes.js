import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { supabase } from '../../../contexts/supabaseClient';

export default function CadastroFuncoes({ navigation, route }) {
  const { tipo, id } = route.params || {}; // 'cargos' ou 'funcoes' e id para edição
  const [formData, setFormData] = useState({
    nome: '',
    descricao: ''
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
              descricao: data.descricao || ''
            });
            setIsEditMode(true);
          }
        } catch (error) {
          Alert.alert('Erro', 'Não foi possível carregar os dados');
          console.error(error);
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const dataToSave = {
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || null
      };

      if (isEditMode) {
        // Atualização
        const { error } = await supabase
          .from(tipo)
          .update(dataToSave)
          .eq('id', id);

        if (error) throw error;
        Alert.alert('Sucesso', `${tipo === 'cargos' ? 'Cargo' : 'Função'} atualizado com sucesso!`);
      } else {
        // Inserção
        const { error } = await supabase
          .from(tipo)
          .insert([dataToSave]);

        if (error) throw error;
        Alert.alert('Sucesso', `${tipo === 'cargos' ? 'Cargo' : 'Função'} cadastrado com sucesso!`);
      }

      navigation.goBack();
    } catch (error) {
      console.error('Erro ao salvar:', error);
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
            {isEditMode ? 'EDITAR' : 'CADASTRAR'} {tipo === 'cargos' ? 'CARGO' : 'FUNÇÃO'}
          </Text>
          
          <TextInput
            label={`Nome ${tipo === 'cargos' ? 'do Cargo' : 'da Função'}*`}
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

// Estilos (mantidos iguais)
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
});