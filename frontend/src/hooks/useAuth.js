import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
//could have directly used useContenxt(AuthContext) but this is to check if the context is used outside of the authprovider
//if so then it would have returned undefined but this gives out a clear error
 