// Shopify Product Extension for Reseller Selection
// This adds a "Select Resellers" field to the Shopify admin product editing page

import { reactExtension, useApi, AdminAction, Banner, Button, Card, InlineLayout, Select, Text, useTranslate, useSettings, useApplyAttributeChange, useAttributeValues, } from '@shopify/ui-extensions-react/admin';

export default reactExtension('purchase.checkout.block.render', () => <App />);

function App() {
  const { i18n } = useApi();
  const translate = useTranslate();
  const { applyAttributeChange } = useApplyAttributeChange();
  const attributeValues = useAttributeValues();

  // Get the product ID from the current context
  const productId = attributeValues?.product?.id;
  
  // State for resellers
  const [resellers, setResellers] = useState([]);
  const [selectedResellers, setSelectedResellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load resellers when component mounts
  useEffect(() => {
    loadResellers();
    loadProductResellers();
  }, [productId]);

  const loadResellers = async () => {
    try {
      const response = await fetch('/api/resellers');
      const data = await response.json();
      setResellers(data);
    } catch (error) {
      console.error('Error loading resellers:', error);
    }
  };

  const loadProductResellers = async () => {
    if (!productId) return;
    
    try {
      const response = await fetch(`/api/products/${productId}/resellers`);
      const data = await response.json();
      setSelectedResellers(data.map(r => r.id));
    } catch (error) {
      console.error('Error loading product resellers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResellerChange = async (resellerIds) => {
    setSelectedResellers(resellerIds);
    setSaving(true);
    
    try {
      await fetch(`/api/products/${productId}/resellers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resellerIds }),
      });
      
      // Show success message
      applyAttributeChange({
        type: 'updateAttribute',
        key: 'resellers',
        value: resellerIds.join(','),
      });
      
    } catch (error) {
      console.error('Error saving resellers:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <InlineLayout columns={['fill']}>
          <Text>Loading resellers...</Text>
        </InlineLayout>
      </Card>
    );
  }

  return (
    <Card>
      <InlineLayout columns={['fill']}>
        <Text size="large" emphasis="bold">
          Select Resellers
        </Text>
        <Text appearance="subdued">
          Choose which resellers carry this product
        </Text>
        
        <Select
          label="Resellers"
          value={selectedResellers}
          onChange={handleResellerChange}
          options={resellers.map(reseller => ({
            label: reseller.name,
            value: reseller.id,
          }))}
          multiple
        />
        
        {selectedResellers.length > 0 && (
          <Banner status="success">
            {selectedResellers.length} reseller(s) selected
          </Banner>
        )}
        
        {saving && (
          <Banner status="info">
            Saving reseller associations...
          </Banner>
        )}
      </InlineLayout>
    </Card>
  );
}
