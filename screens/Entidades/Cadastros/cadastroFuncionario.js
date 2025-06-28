import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  View
} from 'react-native';
import {
  Avatar,
  Button,
  Divider,
  Menu,
  Provider,
  RadioButton,
  Text,
  TextInput
} from 'react-native-paper';
import useCadastroForm from '../../../script/LogicadeFormulario';
import headerStyles from '../../../styles/Estilocabecalho';
import styles from '../../../styles/EstilodeFormulario';


export default function CadastroFuncionariosScreen({ navigation }) {
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const {
    formData,
    errors,
    opcoes,
    datePickerField,
    showSuperiorFields,
    handleAdminChange,
    handleChange,
    handleSubmit,
    pickImage,
    setDatePickerField,
    handleDateChange
  } = useCadastroForm(navigation);

  // Componente SelectorMenu
  const SelectorMenu = ({ label, value, options, onSelect, error, disabled = false }) => {
    const [visible, setVisible] = useState(false);
    const selectedLabel = options.find(o => o.id === value)?.nome || label;
    
    return (
      <View style={styles.inputContainer}>
        <Menu
          visible={visible}
          onDismiss={() => setVisible(false)}
          anchor={
            <TouchableOpacity 
              onPress={() => !disabled && setVisible(true)}
              style={[styles.selectorButton, error && styles.errorBorder, disabled && styles.disabled]}
            >
              <Text style={[styles.selectorText, !value && styles.placeholderText]}>
                {selectedLabel}
              </Text>
            </TouchableOpacity>
          }
          contentStyle={styles.menuContent}
        >
          {options.map(option => (
            <React.Fragment key={option.id}>
              <Menu.Item
                onPress={() => {
                  onSelect(option.id);
                  setVisible(false);
                }}
                title={option.nome}
                titleStyle={styles.menuItemText}
              />
              {option.id !== options[options.length-1].id && <Divider />}
            </React.Fragment>
          ))}
        </Menu>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  };

  // Componente DateInput
  const DateInput = ({ label, value, field }) => (
    <View style={styles.inputContainer}>
      <TouchableOpacity 
        onPress={() => setDatePickerField(field)}
        style={styles.dateInput}
      >
        <Text style={styles.dateInputText}>
          {label}: {value.toLocaleDateString('pt-BR')}
        </Text>
      </TouchableOpacity>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  const onSubmit = async () => {
  setErrorMsg('');
  try {
    setLoading(true);
    await handleSubmit();
  } catch (error) {
    if (error.message?.includes('FetchError') || error.message?.includes('network') || error.message?.includes('timeout')) {
      console.log('Sem conexão. Salvando localmente...');
      await cadastrarLocalmente();
    } else {
      setErrorMsg(error.message || 'Erro ao cadastrar usuário.');
    }
  } finally {
    setLoading(false);
  }
};


  return (
    <Provider>
      <KeyboardAvoidingView style={headerStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={100}>
        <StatusBar backgroundColor="#043b57" barStyle="light-content" />
        
        {/* Cabeçalho */}
        <View style={headerStyles.header}>
          <View style={headerStyles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Image 
                source={require('../../../Assets/logo.png')}
                style={headerStyles.logo}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity  onPress={() => navigation.navigate('Error')}
              >
              <Image 
                source={require('../../../Assets/alerta.png')} 
                style={headerStyles.alerta}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Conteúdo com Scroll */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Seção Foto */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FOTO</Text>
            <View style={styles.photoContainer}>
              <TouchableOpacity onPress={pickImage}>
                {formData.foto ? (
                  <Avatar.Image 
                    size={120} 
                    source={{ uri: formData.foto.uri }} 
                    style={styles.avatar}
                  />
                ) : (
                  <Avatar.Icon 
                    size={120} 
                    icon="camera" 
                    style={styles.avatarPlaceholder}
                  />
                )}
              </TouchableOpacity>
              <Text style={styles.photoText}>
                {formData.foto ? 'Alterar Foto' : 'Adicionar Foto'}
              </Text>
            </View>
          </View>

          {/* Seção Nível de Acesso */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NÍVEL DE ACESSO</Text>
            <View style={styles.sectionContent}>
              <Text style={styles.radioGroupLabel}>Você é administrador?*</Text>
              <View style={styles.radioGroup}>
                <View style={styles.radioButton}>
                  <RadioButton
                    value="true"
                    status={formData.is_admin === true ? 'checked' : 'unchecked'}
                    onPress={() => handleAdminChange('true')}
                    color="#043b57"
                  />
                  <Text style={styles.radioLabel}>Sim (Administrador)</Text>
                </View>
                <View style={styles.radioButton}>
                  <RadioButton
                    value="false"
                    status={formData.is_admin === false ? 'checked' : 'unchecked'}
                    onPress={() => handleAdminChange('false')}
                    color="#043b57"
                  />
                  <Text style={styles.radioLabel}>Não</Text>
                </View>
              </View>
              {errors.is_admin && <Text style={styles.errorText}>{errors.is_admin}</Text>}
            </View>
          </View>

          {/* Seção Dados Pessoais */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DADOS PESSOAIS</Text>
            <View style={styles.sectionContent}>
              <TextInput
                label="Nome Completo*"
                value={formData.nome}
                onChangeText={(text) => handleChange('nome', text)}
                style={styles.input}
                mode="outlined"
                error={!!errors.nome}
              />
              {errors.nome && <Text style={styles.errorText}>{errors.nome}</Text>}
              
              <DateInput 
                label="Data de Nascimento" 
                value={formData.dataNascimento} 
                field="dataNascimento" 
              />
              
              <DateInput 
                label="Data de Admissão" 
                value={formData.dataAdmissao} 
                field="dataAdmissao" 
              />
              
              <SelectorMenu
                label="Selecione o Gênero*"
                value={formData.genero_id}
                options={opcoes.generos}
                onSelect={(value) => handleChange('genero_id', Number(value))}
                error={errors.genero_id}
              />
            </View>
          </View>

          {/* Seção Documentos */}
          <View style={styles.section}>
            <Text style={styles.sectionSubtitle}>DOCUMENTOS</Text>
            <View style={styles.sectionContent}>
              <TextInput
                label="CPF*"
                value={formData.CPF}
                onChangeText={(text) => handleChange('CPF', text)}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
                maxLength={14}
                error={!!errors.CPF}
              />
              {errors.CPF && <Text style={styles.errorText}>{errors.CPF}</Text>}
              
              <TextInput
                label="CTPS*"
                value={formData.ctps}
                onChangeText={(text) => handleChange('ctps', text)}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
                maxLength={11}
                error={!!errors.ctps}
              />
              {errors.ctps && <Text style={styles.errorText}>{errors.ctps}</Text>}
              
              <TextInput
                label="RG*"
                value={formData.rg}
                onChangeText={(text) => handleChange('rg', text)}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
                maxLength={11}
                error={!!errors.rg}
              />
              {errors.rg && <Text style={styles.errorText}>{errors.rg}</Text>}
            </View>
          </View>

          {/* Seção Dados Profissionais (somente para não-admins) */}
          {formData.is_admin === false && (
            <View style={styles.section}>
              <Text style={styles.sectionSubtitle}>DADOS PROFISSIONAIS</Text>
              <View style={styles.sectionContent}>
                <SelectorMenu
                  label="Selecione a Hierarquia*"
                  value={formData.hierarquia_id}
                  options={opcoes.hierarquias}
                  onSelect={(value) => handleChange('hierarquia_id', value)}
                  error={errors.hierarquia_id}
                />
                
                <SelectorMenu
                  label="Selecione a Função*"
                  value={formData.funcao_id}
                  options={opcoes.funcoes}
                  onSelect={(value) => handleChange('funcao_id', value)}
                  error={errors.funcao_id}
                />
              </View>
            </View>
          )}

          {/* Seção Dados Trabalhistas */}
          <View style={styles.section}>
            <Text style={styles.sectionSubtitle}>DADOS TRABALHISTAS</Text>
            <View style={styles.sectionContent}>
              <TextInput
                label="Carga Horária*"
                value={formData.cargaHoraria}
                onChangeText={(text) => handleChange('cargaHoraria', text)}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
                error={!!errors.cargaHoraria}
              />
              {errors.cargaHoraria && <Text style={styles.errorText}>{errors.cargaHoraria}</Text>}
              
              <TextInput
                label="Nº de Dependentes*"
                value={formData.nDependentes}
                onChangeText={(text) => handleChange('nDependentes', text)}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
                error={!!errors.nDependentes}
              />
              {errors.nDependentes && <Text style={styles.errorText}>{errors.nDependentes}</Text>}
              
              <TextInput
                label="Número da Ficha*"
                value={formData.numeroFicha}
                onChangeText={(text) => handleChange('numeroFicha', text)}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
                maxLength={5} // Limitador de 5 dígitos
                error={!!errors.numeroFicha}
              />
              {errors.numeroFicha && <Text style={styles.errorText}>{errors.numeroFicha}</Text>}
              
              <TextInput
                label="Nº do Aparelho Eletrônico"
                value={formData.numeroAparelho}
                onChangeText={(text) => handleChange('numeroAparelho', text)}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Seção Endereço */}
          <View style={styles.section}>
            <Text style={styles.sectionSubtitle}>ENDEREÇO</Text>
            <View style={styles.sectionContent}>
              <TextInput
                label="CEP*"
                value={formData.cep}
                onChangeText={(text) => handleChange('cep', text)}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
                maxLength={9}
                error={!!errors.cep}
              />
              {errors.cep && <Text style={styles.errorText}>{errors.cep}</Text>}
              
              <TextInput
                label="UF*"
                value={formData.uf}
                onChangeText={(text) => handleChange('uf', text)}
                style={styles.input}
                mode="outlined"
                maxLength={2}
                error={!!errors.uf}
              />
              {errors.uf && <Text style={styles.errorText}>{errors.uf}</Text>}
              
              <TextInput
                label="Cidade*"
                value={formData.cidade}
                onChangeText={(text) => handleChange('cidade', text)}
                style={styles.input}
                mode="outlined"
                error={!!errors.cidade}
              />
              {errors.cidade && <Text style={styles.errorText}>{errors.cidade}</Text>}
              
              <TextInput
                label="Bairro*"
                value={formData.bairro}
                onChangeText={(text) => handleChange('bairro', text)}
                style={styles.input}
                mode="outlined"
                error={!!errors.bairro}
              />
              {errors.bairro && <Text style={styles.errorText}>{errors.bairro}</Text>}
              
              <TextInput
                label="Rua*"
                value={formData.rua}
                onChangeText={(text) => handleChange('rua', text)}
                style={styles.input}
                mode="outlined"
                error={!!errors.rua}
              />
              {errors.rua && <Text style={styles.errorText}>{errors.rua}</Text>}
              
              <TextInput
                label="Número*"
                value={formData.numero}
                onChangeText={(text) => handleChange('numero', text)}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
                maxLength={10} // Limitador de 10 caracteres
                error={!!errors.numero}
              />
              {errors.numero && <Text style={styles.errorText}>{errors.numero}</Text>}
              
              <SelectorMenu
                label="Selecione o Tipo*"
                value={formData.tipo_endereco}
                options={[
                  { id: 'residencial', nome: 'Residencial' },
                  { id: 'comercial', nome: 'Comercial' },
                  { id: 'outro', nome: 'Outro' }
                ]}
                onSelect={(value) => handleChange('tipo_endereco', value)}
                error={errors.tipo_endereco}
              />
              
              <TextInput
                label="Complemento"
                value={formData.complemento}
                onChangeText={(text) => handleChange('complemento', text)}
                style={styles.input}
                mode="outlined"
              />
            </View>
          </View>

          {/* Seção Contatos */}
          <View style={styles.section}>
            <Text style={styles.sectionSubtitle}>CONTATOS</Text>
            <View style={styles.sectionContent}>
              <TextInput
                label="Telefone Principal*"
                value={formData.telefone1}
                onChangeText={(text) => handleChange('telefone1', text)}
                style={styles.input}
                mode="outlined"
                keyboardType="phone-pad"
                maxLength={15}
                error={!!errors.telefone1}
              />
              {errors.telefone1 && <Text style={styles.errorText}>{errors.telefone1}</Text>}
              
              <TextInput
                label="Telefone Secundário"
                value={formData.telefone2}
                onChangeText={(text) => handleChange('telefone2', text)}
                style={styles.input}
                mode="outlined"
                keyboardType="phone-pad"
                maxLength={15}
              />
              
              <TextInput
                label="E-mail Principal*"
                value={formData.email1}
                onChangeText={(text) => handleChange('email1', text)}
                style={styles.input}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!errors.email1}
              />
              {errors.email1 && <Text style={styles.errorText}>{errors.email1}</Text>}
              
              <TextInput
                label="E-mail Secundário"
                value={formData.email2}
                onChangeText={(text) => handleChange('email2', text)}
                style={styles.input}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Seção Superior (se não for admin) */}
          {showSuperiorFields && (
            <View style={styles.section}>
              <Text style={styles.sectionSubtitle}>SUPERIOR HIERÁRQUICO</Text>
              <View style={styles.sectionContent}>
                <SelectorMenu
                  label="Superior Hierárquico*"
                  value={formData.superior_id}
                  options={opcoes.superiores}
                  onSelect={(value) => handleChange('superior_id', value)}
                  error={errors.superior_id}
                  disabled={formData.is_admin}
/>
              </View>
            </View>
          )}

          {/* Seção Senha */}
          <View style={styles.section}>
            <Text style={styles.sectionSubtitle}>ACESSO</Text>
            <View style={styles.sectionContent}>
              <TextInput
                label="Senha*"
                value={formData.senha}
                onChangeText={(text) => handleChange('senha', text)}
                style={styles.input}
                mode="outlined"
                secureTextEntry
                error={!!errors.senha}
              />
              {errors.senha && <Text style={styles.errorText}>{errors.senha}</Text>}
              
              <TextInput
                label="Confirmar Senha*"
                value={formData.confirmarSenha}
                onChangeText={(text) => handleChange('confirmarSenha', text)}
                style={styles.input}
                mode="outlined"
                secureTextEntry
                error={!!errors.confirmarSenha}
              />
              {errors.confirmarSenha && <Text style={styles.errorText}>{errors.confirmarSenha}</Text>}
            </View>
          </View>

          {/* Botão de Cadastro */}
          <View style={styles.buttonContainer}>
            <Button 
              mode="contained" 
              onPress={onSubmit}
              style={styles.registerButton}
              labelStyle={styles.buttonLabel}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : 'CADASTRAR'}
            </Button>
            {errorMsg ? (
              <Text style={{ color: 'red', marginTop: 10, textAlign: 'center' }}>{errorMsg}</Text>
            ) : null}
          </View>
        </ScrollView>

        {/* DatePicker */}
        {datePickerField && (
          <DateTimePicker
            value={formData[datePickerField]}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
      </KeyboardAvoidingView>
    </Provider>
  );
}