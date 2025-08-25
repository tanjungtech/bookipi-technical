import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {

  it('should render the main content section', () => {
    // Render the App component
    render(<App />);

    // Query for the main content element
    const mainElement = screen.getByRole('main');

    // Assert that the main element is present in the document
    expect(mainElement).toBeInTheDocument();
  });

  it('should display the flash sale item card', () => {
    render(<App />);

    // Query for the specific elements within the card
    const cardElement = screen.getByText('Flash Sale Item');
    const descriptionElement = screen.getByText('Flash Sale Description');
    const discountElement = screen.getByText('50% off');
    const imageElement = screen.getByRole('img', { name: /Flash Sale Item/i });

    // Assert that each part of the card is visible
    expect(cardElement).toBeInTheDocument();
    expect(descriptionElement).toBeInTheDocument();
    expect(discountElement).toBeInTheDocument();
    expect(imageElement).toBeInTheDocument();
  });

  it('should have the correct image source and alt text', () => {
    render(<App />);

    // Query for the image element using its role and alt text
    const imageElement = screen.getByRole('img', { name: /Flash Sale Item/i });

    // Assert that the image has the correct source and alt attributes
    expect(imageElement).toHaveAttribute('src', 'https://images.unsplash.com/photo-1511556820780-d912e42b4980');
    expect(imageElement).toHaveAttribute('alt', 'Flash Sale Item');
  });

});