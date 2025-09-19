import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Select,
  Text,
  InlineLayout,
  Banner,
  Spinner,
  BlockStack,
  Checkbox,
  Divider,
} from '@shopify/polaris';

export default function ProductResellerSelector({ productId }) {
  const [resellers, setResellers] = useState([]);
  const [selectedResellers, setSelectedResellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    // Get API URL from app settings
    setApiUrl(window.location.origin); // or use your deployed app URL
    
    if (productId) {
      loadResellers();
      loadProductResellers();
    }
  }, [productId, apiUrl]);

  const loadResellers = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/resellers`);
      if (!response.ok) throw new Error('Failed to load resellers');
      
      const data = await response.json();
      setResellers(data);
    } catch (error) {
      console.error('Error loading resellers:', error);
      setMessage('Error loading resellers: ' + error.message);
    }
  };

  const loadProductResellers = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/products/${productId}/resellers`);
      if (!response.ok) throw new Error('Failed to load product resellers');
      
      const data = await response.json();
      setSelectedResellers(data.map(r => r.id));
    } catch (error) {
      console.error('Error loading product resellers:', error);
      setSelectedResellers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      const response = await fetch(`${apiUrl}/api/products/${productId}/resellers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          resellerIds: selectedResellers 
        }),
      });

      if (response.ok) {
        setMessage('Resellers updated successfully!');
      } else {
        throw new Error('Failed to save resellers');
      }
    } catch (error) {
      console.error('Error saving resellers:', error);
      setMessage('Error saving resellers: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleReseller = (resellerId) => {
    setSelectedResellers(prev => {
      if (prev.includes(resellerId)) {
        return prev.filter(id => id !== resellerId);
      } else {
        return [...prev, resellerId];
      }
    });
  };

  const selectAllResellers = () => {
    setSelectedResellers(resellers.map(r => r.id));
  };

  const clearAllResellers = () => {
    setSelectedResellers([]);
  };

  if (loading) {
    return (
      <Card sectioned>
        <InlineLayout align="center">
          <Spinner size="small" />
          <Text>Loading resellers...</Text>
        </InlineLayout>
      </Card>
    );
  }

  return (
    <Card sectioned>
      <BlockStack gap="4">
        <Text variant="headingMd">Select Resellers</Text>
        <Text>Choose which resellers carry this product:</Text>
        
        <InlineLayout gap="2">
          <Button onClick={selectAllResellers} size="slim">
            Select All
          </Button>
          <Button onClick={clearAllResellers} size="slim">
            Clear All
          </Button>
        </InlineLayout>

        <BlockStack gap="2">
          {resellers.map(reseller => (
            <Checkbox
              key={reseller.id}
              label={reseller.name}
              checked={selectedResellers.includes(reseller.id)}
              onChange={() => toggleReseller(reseller.id)}
            />
          ))}
        </BlockStack>
        
        <Divider />
        
        <InlineLayout align="space-between">
          <Text>
            {selectedResellers.length} reseller(s) selected
          </Text>
          <Button 
            primary 
            onClick={handleSave}
            loading={saving}
          >
            Save Resellers
          </Button>
        </InlineLayout>
        
        {message && (
          <Banner 
            status={message.includes('Error') ? 'critical' : 'success'}
            onDismiss={() => setMessage('')}
          >
            {message}
          </Banner>
        )}
        
        {selectedResellers.length > 0 && (
          <Card sectioned>
            <BlockStack gap="2">
              <Text variant="headingSm">Selected Resellers:</Text>
              {selectedResellers.map(id => {
                const reseller = resellers.find(r => r.id === id);
                return reseller ? (
                  <Text key={id}>• {reseller.name}</Text>
                ) : null;
              })}
            </BlockStack>
          </Card>
        )}
      </BlockStack>
    </Card>
  );
}
