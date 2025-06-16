import React, { createContext, useState } from 'react';

export const NomesContext = createContext();

export const NomesProvider = ({ children }) => {
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [nomeEmpresa, setNomeEmpresa] = useState('');

  return (
    <NomesContext.Provider value={{
      nomeUsuario,
      setNomeUsuario,
      nomeEmpresa, 
      setNomeEmpresa
    }}>
      {children}
    </NomesContext.Provider>
  );
};