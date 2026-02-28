import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { api } from '../api';
import authReducer from '../store/slices/authSlice';
import Register from '../pages/Register';

const createTestStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      [api.reducerPath]: api.reducer,
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

describe('Register Page', () => {
  it('should render registration form', () => {
    renderWithRouter(<Register />);
    
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/clinic name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('should render registration heading', () => {
    renderWithRouter(<Register />);
    
    expect(screen.getByText(/create your account/i)).toBeInTheDocument();
  });

  it('should have create account button', () => {
    renderWithRouter(<Register />);
    
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('should have sign in link', () => {
    renderWithRouter(<Register />);
    
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should update form state on input changes', () => {
    renderWithRouter(<Register />);
    
    const firstNameInput = screen.getByLabelText(/first name/i);
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    expect(firstNameInput).toHaveValue('John');
  });
});
