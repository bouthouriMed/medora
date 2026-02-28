import { render, screen, waitFor } from '@testing-library/react';
import { showToast, ToastContainer } from '../components/Toast';

describe('Toast Component', () => {
  beforeEach(() => {
    render(<ToastContainer />);
  });

  it('should render toast with success message', async () => {
    showToast('Operation successful', 'success');
    
    await waitFor(() => {
      expect(screen.getByText('Operation successful')).toBeInTheDocument();
    });
  });

  it('should render toast with error message', async () => {
    showToast('Something went wrong', 'error');
    
    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  it('should have correct styling for success toast', async () => {
    showToast('Success message', 'success');
    
    await waitFor(() => {
      const toast = screen.getByText('Success message');
      expect(toast).toHaveClass('bg-green-500');
    });
  });

  it('should have correct styling for error toast', async () => {
    showToast('Error message', 'error');
    
    await waitFor(() => {
      const toast = screen.getByText('Error message');
      expect(toast).toHaveClass('bg-red-500');
    });
  });
});
