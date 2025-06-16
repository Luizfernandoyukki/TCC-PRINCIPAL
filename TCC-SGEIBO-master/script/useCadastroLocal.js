import { Alert } from 'react-native';
import { databaseService } from '../services/localDatabase';
import { generateUUID } from '../utils/uuid';

export default function useCadastroLocal(formData, opcoes, navigation) {
  const cadastrarLocalmente = async () => {
    try {
      const userId = generateUUID();

      // 1. Inserir endereço
      const enderecoId = await databaseService.insert('endereco', {
        cep: formData.cep.replace(/\D/g, ''),
        uf: formData.uf,
        cidade: formData.cidade,
        bairro: formData.bairro,
        rua: formData.rua,
        numero: formData.numero,
        complemento: formData.complemento,
        tipo: formData.tipo_endereco
      });

      // 2. Inserir funcionário
      const funcionario = {
        id: userId,
        nome: formData.nome.trim(),
        data_nascimento: formData.dataNascimento,
        cpf: formData.CPF.replace(/\D/g, ''),
        ctps: formData.ctps,
        rg: formData.rg,
        data_admissao: formData.dataAdmissao,
        carga_horaria: Number(formData.cargaHoraria),
        numero_dependentes: Number(formData.nDependentes),
        numero_ficha: formData.numeroFicha,
        numero_aparelho: formData.numeroAparelho,
        hierarquia_id: Number(formData.hierarquia_id),
        funcao_id: Number(formData.funcao_id),
        cargo_id: Number(formData.cargo_id),
        genero_id: Number(formData.genero_id),
        is_admin: formData.is_admin ? 1 : 0,
        is_superior: formData.is_superior ? 1 : 0,
        superior_id: formData.superior_id,
        endereco_id: enderecoId,
        foto_url: null,
        last_sync: null, // <- Para sincronizar depois
      };

      await databaseService.insert('funcionario', funcionario);

      // 3. Telefones
      if (formData.telefone1) {
        await databaseService.insert('telefone', {
          tipo: 'principal',
          numero: formData.telefone1.replace(/\D/g, ''),
          funcionario_id: userId
        });
      }
      if (formData.telefone2) {
        await databaseService.insert('telefone', {
          tipo: 'secundario',
          numero: formData.telefone2.replace(/\D/g, ''),
          funcionario_id: userId
        });
      }

      // 4. Emails
      if (formData.email1) {
        await databaseService.insert('email', {
          tipo: 'principal',
          email: formData.email1,
          funcionario_id: userId
        });
      }
      if (formData.email2) {
        await databaseService.insert('email', {
          tipo: 'secundario',
          email: formData.email2,
          funcionario_id: userId
        });
      }

      Alert.alert('Sucesso', 'Cadastro salvo localmente!');
      navigation.navigate('Login');

    } catch (error) {
      console.error('Erro ao cadastrar local:', error);
      Alert.alert('Erro', 'Erro ao cadastrar offline. Tente novamente.');
    }
  };

  return { cadastrarLocalmente };
}
