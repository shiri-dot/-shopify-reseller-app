import { reactExtension, useApi, useSettings, useApplyAttributeChange, useAttributeValues } from '@shopify/ui-extensions-react/admin';
import ProductResellerField from './ProductResellerField';

export default reactExtension('purchase.checkout.block.render', () => <App />);

function App() {
  const { i18n } = useApi();
  const { api_url } = useSettings();
  const { applyAttributeChange } = useApplyAttributeChange();
  const attributeValues = useAttributeValues();
  
  // Get the current product ID from the Shopify admin context
  const productId = attributeValues?.product?.id || window.location.pathname.split('/').pop();
  
  return <ProductResellerField productId={productId} apiUrl={api_url} />;
}
