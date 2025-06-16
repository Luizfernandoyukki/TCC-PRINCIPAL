import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#844a05',
  },
  header: {
    height: 160,
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
    marginTop: 60,
  },
  alerta: {
    width: 50,
    height: 50,
    marginRight: 30,
    marginTop: 60,
  },
  card: {
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: '#fadb53',
    borderRadius: 65,
    padding: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: 350,
    height: 400,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 30,
    textAlign: 'center',
    fontFamily: 'adlery blockletter'
  },
  input: {
    marginBottom: 25,
    backgroundColor: 'white',
    borderRadius: 25,
    borderTopEndRadius: 25,
    borderTopLeftRadius: 25,
  },
  loginButton: {
    marginTop: 10,
    backgroundColor: '#043b57',
    borderRadius: 25,
    width: 170,
  },
  buttonLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  botoes: {
    alignItems: 'center',
    marginTop: 15,
  },
  cadastroText: {
    marginTop: 8,
    fontSize: 14,
    color: '#3b82f6',
    textDecorationLine: 'underline',
    alignItems: 'center',
    fontWeight: 'bold',
  },
});

export default styles;