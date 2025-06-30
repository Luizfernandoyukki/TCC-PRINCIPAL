import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  scrollContent: {
     padding: 20,
    paddingBottom: 30,
  },
  container: {
    flex: 1,
    backgroundColor: '#844a05',
  },
  section: {
    backgroundColor: '#fadb53',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#043b57',
    marginBottom: 15,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#043b57',
    marginBottom: 15,
  },
  sectionContent: {
    paddingHorizontal: 5,
  },
  inputContainer: {
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'white',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    fontSize: 12,
    marginLeft: 5,
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerButton: {
    backgroundColor: '#043b57',
    borderRadius: 25,
    width: 200,
    paddingVertical: 5,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  radioGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  radioLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
  radioGroupLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#043b57',
  },
  selectorButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 15,
    backgroundColor: 'white',
  },
  errorBorder: {
    borderColor: 'red',
  },
  selectorText: {
    fontSize: 16,
  },
  placeholderText: {
    color: '#757575',
  },
  menuContent: {
    backgroundColor: 'white',
  },
  menuItemText: {
    color: '#043b57',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 15,
    backgroundColor: 'white',
  },
  dateInputText: {
    fontSize: 16,
  },
  photoContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  avatar: {
    backgroundColor: '#043b57',
  },
  avatarPlaceholder: {
    backgroundColor: '#e0e0e0',
  },
  photoText: {
    marginTop: 10,
    color: '#043b57',
    fontWeight: 'bold',
  },
  disabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.7
  }
});