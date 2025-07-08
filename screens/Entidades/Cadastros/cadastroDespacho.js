// src/screens/entregas/CadastroDespacho.js

import NetInfo from '@react-native-community/netinfo';
import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar, TouchableOpacity, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { supabase } from '../../../contexts/supabaseClient';
import { databaseService } from '../../../services/localDatabase';
import styles from '../../../styles/EstilosdeEntidade';

export default function CadastroDespacho({ navigation }) {
  const [formData, setFormData] = useState({
    data_saida: '',
    observacao: '',
    status: 'despachado'
  });

  const [entregaId, setEntregaId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.data_saida.trim()) newErrors.data_saida = 'Data de saída é obrigatória';
    if (!entregaId) newErrors.entregaId = 'Entrega obrigatória';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      const state = await NetInfo.fetch();

      const despachoData = {
        entrega_id: entregaId,
        data_saida: formData.data_saida.trim(),
        observacao: formData.observacao?.trim() || null,
        status: formData.status
      };

      if (state.isConnected) {
        const { error } = await supabase.from('saida').insert([despachoData]);
        if (error) throw error;
      } else {
        await databaseService.insertWithUUID('saida', despachoData);
      }

      Alert.alert('Sucesso', 'Despacho registrado com sucesso!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', error.message || 'Falha ao registrar despacho');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <StatusBar backgroundColor="#043b57" barStyle="light-content" />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image source={require('../../../Assets/logo.png')} style={styles.logo} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('MenuPrincipalADM')}>
            <Image source={require('../../../Assets/ADM.png')} style={styles.alerta} resizeMode="contain" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CADASTRO DE DESPACHO</Text>

          <TextInput
            label="ID da Entrega*"
            value={entregaId}
            onChangeText={setEntregaId}
            style={styles.input}
            keyboardType="numeric"
            error={!!errors.entregaId}
          />
          {!!errors.entregaId && <Text style={styles.errorText}>{errors.entregaId}</Text>}

          <TextInput
            label="Data de Saída*"
            value={formData.data_saida}
            onChangeText={text => setFormData({ ...formData, data_saida: text })}
            style={styles.input}
            placeholder="AAAA-MM-DDTHH:MM"
            error={!!errors.data_saida}
          />
          {!!errors.data_saida && <Text style={styles.errorText}>{errors.data_saida}</Text>}

          <TextInput
            label="Observação"
            value={formData.observacao}
            onChangeText={text => setFormData({ ...formData, observacao: text })}
            style={styles.input}
            multiline
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.buttonEditar}
            labelStyle={styles.buttonTextInput}
            loading={loading}
            disabled={loading}
          >
            REGISTRAR DESPACHO
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
