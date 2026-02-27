import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { api } from '../api';
import authReducer from '../store/slices/authSlice';
import Login from '../pages/Login';

const createTestStore = (isAuthenticated = false) =>
  configureStore({
    reducer: {
      auth: authReducer,
      [api.reducerPath]: api.reducer,
    },
    preloadedState: {
      auth: {
        isAuthenticated,
        user: isAuthenticated ? { id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User', role: 'DOCTOR', clinicId: 'clinic-1' } : null,
        token: isAuthenticated ? 'test-token' : null,
      },
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(api.middleware),
  });

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <Provider store={createTestStore()}>{component}</Provider>
    </BrowserRouter>
  );
};

describe('Login Page', () => {
  it('should render login form', () => {
    renderWithRouter(<Login />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('should render login heading', () => {
    renderWithRouter(<Login />);
    
    expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
  });

  it('should have sign in button', () => {
    renderWithRouter(<Login />);
    
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should have register link', () => {
    renderWithRouter(<Login />);
    
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
  });

  it('should update email state on input change', () => {
    renderWithRouter(<Login />);
    
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('should update password state on input change', () => {
    renderWithRouter(<Login />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(passwordInput).toHaveValue('password123');
  });

  it('should show demo credentials hint', () => {
    renderWithRouter(<Login />);
    
    expect(screen.getByText(/demo:/i)).toBeInTheDocument();
  });
});
