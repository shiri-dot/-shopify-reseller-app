import { reactExtension, useApi, useSettings } from '@shopify/ui-extensions-react/admin';
import ProductResellerSelector from './ProductResellerSelector';

export default reactExtension('purchase.checkout.block.render', () => <App />);

function App() {
  const { i18n } = useApi();
  const { api_url } = useSettings();
  
  // Get the current product ID from the Shopify admin context
  const productId = window.location.pathname.split('/').pop();
  
  return <ProductResellerSelector productId={productId} apiUrl={api_url} />;
}
