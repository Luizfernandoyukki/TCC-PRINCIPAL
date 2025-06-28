import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../contexts/supabaseClient';
import { databaseService } from '../../../services/localDatabase';
import styles from '../../../styles/EstilosdeEntidade';

export default function EditarEstoque({ route, navigation }) {
  const { itemId } = route.params;
  const [item, setItem] = useState(null);
  const [useLocalData, setUseLocalData] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarItem();
  }, []);

  const carregarItem = async () => {
    try {
      if (useLocalData) {
        const resultadoLocal = await databaseService.selectById('estoque', itemId);
        setItem(resultadoLocal);
      } else {
        const { data, error } = await supabase
          .from('estoque')
          .select('*')
          .eq('id', itemId)
          .single();
        if (error) throw error;
        setItem(data);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar o item.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (campo, valor) => {
    setItem({ ...item, [campo]: valor });
  };

  const salvarAlteracoes = async () => {
    try {
      if (!item.nome || !item.quantidade || !item.valor || !item.data_aquisicao) {
        Alert.alert('Aviso', 'Preencha os campos Nome, Quantidade, Valor e Data de Aquisição.');
        return;
      }

      // Ajustar cliente_id para null se vazio ou inválido
      const clienteId = item.cliente_id ? Number(item.cliente_id) : null;

      if (useLocalData) {
        await databaseService.update('estoque', {
          ...item,
          cliente_id: clienteId,
        }, 'id = ?', [item.id]);
      } else {
        const { error } = await supabase
          .from('estoque')
          .update({
            nome: item.nome.trim(),
            tipo: item.tipo,
            numero_serie: item.numero_serie?.trim() || null, // "Lote"
            quantidade: Number(item.quantidade),
            valor: Number(item.valor),
            data_aquisicao: item.data_aquisicao,
            data_validade: item.data_validade || null,
            peso: item.peso ? Number(item.peso) : null,
            modalidade: item.modalidade || null,
            observacao: item.observacao || null,
            funcionario_id: item.funcionario_id,
            cliente_id: clienteId,
            // Não atualiza disponivel_geral nem quantidade_reservada
          })
          .eq('id', item.id);
        if (error) throw error;
      }

      Alert.alert('Sucesso', 'Item atualizado com sucesso.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    }
  };

  if (loading || !item) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#043b57" barStyle="light-content" />
        <Text style={styles.emptyText}>Carregando item...</Text>
      </View>
    );
  }

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
    <ScrollView style={styles.scrollContent}>
      <StatusBar backgroundColor="#043b57" barStyle="light-content" />
      <View style={styles.section}>
        <Text style={styles.label}>Nome:</Text>
        <TextInput
          style={styles.input}
          value={item.nome}
          onChangeText={(text) => handleChange('nome', text)}
        />

        <Text style={styles.label}>Lote:</Text>
        <TextInput
          style={styles.input}
          value={item.numero_serie || ''}
          onChangeText={(text) => handleChange('numero_serie', text)}
        />

        <Text style={styles.label}>Quantidade:</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(item.quantidade)}
          onChangeText={(text) => handleChange('quantidade', parseInt(text) || 0)}
        />

        <Text style={styles.label}>Valor (R$):</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={String(item.valor)}
          onChangeText={(text) => handleChange('valor', parseFloat(text) || 0)}
        />

        <Text style={styles.label}>Data de Aquisição (YYYY-MM-DD):</Text>
        <TextInput
          style={styles.input}
          value={item.data_aquisicao}
          onChangeText={(text) => handleChange('data_aquisicao', text)}
          placeholder="YYYY-MM-DD"
        />

        <Text style={styles.label}>Data de Validade (YYYY-MM-DD):</Text>
        <TextInput
          style={styles.input}
          value={item.data_validade || ''}
          onChangeText={(text) => handleChange('data_validade', text)}
          placeholder="YYYY-MM-DD"
        />

        <Text style={styles.label}>Tipo:</Text>
        <TextInput
          style={styles.input}
          value={item.tipo || ''}
          onChangeText={(text) => handleChange('tipo', text)}
        />

        <Text style={styles.label}>Peso (kg):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={item.peso ? String(item.peso) : ''}
          onChangeText={(text) => handleChange('peso', parseFloat(text) || 0)}
        />

        <Text style={styles.label}>Modalidade:</Text>
        <TextInput
          style={styles.input}
          value={item.modalidade || ''}
          onChangeText={(text) => handleChange('modalidade', text)}
        />

        <Text style={styles.label}>Observação:</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          multiline
          value={item.observacao || ''}
          onChangeText={(text) => handleChange('observacao', text)}
        />
        <TouchableOpacity
          style={styles.buttonEditar}
          onPress={salvarAlteracoes}
        >
          <Text style={styles.buttonTextInput}>Salvar Alterações</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </View>
  );
}
