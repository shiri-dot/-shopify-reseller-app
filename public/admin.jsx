import {
  AppProvider,
  Banner,
  Button,
  Card,
  DataTable,
  FormLayout,
  Frame,
  InlineStack,
  Modal,
  Page,
  TextContainer,
  TextField,
  Toast,
} from "@shopify/polaris";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

function useResellers() {
  const [resellers, setResellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/resellers");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setResellers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load resellers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { resellers, loading, error, reload: load };
}

function ResellerTable() {
  const { resellers, loading, error, reload } = useResellers();
  const [editingReseller, setEditingReseller] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReseller, setDeleteReseller] = useState(null);
  const [toast, setToast] = useState(null);

  const handleEdit = (reseller) => {
    setEditingReseller(reseller);
    setShowModal(true);
  };

  const handleDelete = (reseller) => {
    setDeleteReseller(reseller);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteReseller) return;

    try {
      const response = await fetch(`/api/resellers/${deleteReseller.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete reseller");

      setToast({ content: "Reseller deleted successfully" });
      setShowDeleteModal(false);
      setDeleteReseller(null);
      reload();
    } catch (error) {
      setToast({ content: "Failed to delete reseller", error: true });
    }
  };

  const handleSave = async (resellerData) => {
    try {
      const url = editingReseller?.id
        ? `/api/resellers/${editingReseller.id}`
        : "/api/resellers";
      const method = editingReseller?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resellerData),
      });

      if (!response.ok) throw new Error("Failed to save reseller");

      setToast({
        content: editingReseller?.id
          ? "Reseller updated successfully"
          : "Reseller created successfully",
      });
      setShowModal(false);
      setEditingReseller(null);
      reload();
    } catch (error) {
      setToast({ content: "Failed to save reseller", error: true });
    }
  };

  const rows = resellers.map((r) => [
    r.logo_url
      ? `<img src="${r.logo_url}" alt="logo" style="height:28px; width:28px; object-fit:cover; border-radius:4px"/>`
      : "No Logo",
    r.name || "",
    r.description || "-",
    r.website_url
      ? `<a href="${r.website_url}" target="_blank" style="color:#5c6ac4; text-decoration:none;">Visit Website</a>`
      : "-",
    r.location_url
      ? `<a href="${r.location_url}" target="_blank" style="color:#5c6ac4; text-decoration:none;">View Location</a>`
      : "-",
    `<button onclick="window.editReseller(${r.id})" style="background:#5c6ac4; color:white; border:none; padding:4px 8px; border-radius:4px; margin-right:4px; cursor:pointer;">Edit</button>
     <button onclick="window.deleteReseller(${r.id})" style="background:#d82c0d; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Delete</button>`,
  ]);

  // Make functions globally available for onclick handlers
  useEffect(() => {
    window.editReseller = (id) => {
      const reseller = resellers.find((r) => r.id === id);
      if (reseller) handleEdit(reseller);
    };
    window.deleteReseller = (id) => {
      const reseller = resellers.find((r) => r.id === id);
      if (reseller) handleDelete(reseller);
    };
  }, [resellers]);

  const toastMarkup = toast ? (
    <Toast
      content={toast.content}
      error={toast.error}
      onDismiss={() => setToast(null)}
    />
  ) : null;

  return (
    <Frame>
      <Card>
        {error ? (
          <Banner tone="critical" title="Failed to load data">
            <p>{error}</p>
          </Banner>
        ) : null}
        <InlineStack
          align="space-between"
          blockAlign="center"
          gap="400"
          padding="400"
        >
          <Button onClick={reload} loading={loading} variant="primary">
            Refresh
          </Button>
          <Button onClick={() => handleEdit(null)} variant="primary">
            Add Reseller
          </Button>
        </InlineStack>
        <div style={{ overflowX: "auto" }}>
          <DataTable
            columnContentTypes={[
              "text",
              "text",
              "text",
              "text",
              "text",
              "text",
            ]}
            headings={[
              "Logo",
              "Name",
              "Description",
              "Website",
              "Location",
              "Actions",
            ]}
            rows={rows}
          />
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingReseller(null);
        }}
        title={editingReseller ? "Edit Reseller" : "Add Reseller"}
        primaryAction={{
          content: "Save",
          onAction: () => {
            // This will be handled by the form submission
          },
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => {
              setShowModal(false);
              setEditingReseller(null);
            },
          },
        ]}
      >
        <Modal.Section>
          <ResellerForm
            reseller={editingReseller}
            onSave={handleSave}
            onCancel={() => {
              setShowModal(false);
              setEditingReseller(null);
            }}
          />
        </Modal.Section>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteReseller(null);
        }}
        title="Delete Reseller"
        primaryAction={{
          content: "Delete",
          destructive: true,
          onAction: confirmDelete,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => {
              setShowDeleteModal(false);
              setDeleteReseller(null);
            },
          },
        ]}
      >
        <Modal.Section>
          <TextContainer>
            <p>
              Are you sure you want to delete "{deleteReseller?.name}"? This
              action cannot be undone.
            </p>
          </TextContainer>
        </Modal.Section>
      </Modal>

      {toastMarkup}
    </Frame>
  );
}

function ResellerForm({ reseller, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: reseller?.name || "",
    logo_url: reseller?.logo_url || "",
    description: reseller?.description || "",
    website_url: reseller?.website_url || "",
    location_url: reseller?.location_url || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field) => (value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormLayout>
        <TextField
          label="Reseller Name"
          value={formData.name}
          onChange={handleChange("name")}
          required
        />
        <TextField
          label="Logo URL"
          value={formData.logo_url}
          onChange={handleChange("logo_url")}
          helpText="Enter the URL of the reseller's logo image"
        />
        <TextField
          label="Description"
          value={formData.description}
          onChange={handleChange("description")}
          multiline={3}
        />
        <TextField
          label="Website URL"
          value={formData.website_url}
          onChange={handleChange("website_url")}
          type="url"
        />
        <TextField
          label="Location URL"
          value={formData.location_url}
          onChange={handleChange("location_url")}
          type="url"
          helpText="URL to the reseller's location or contact information"
        />
      </FormLayout>
    </form>
  );
}

function AdminApp() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);

  const onSearch = async () => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      const response = await fetch(
        `/api/resellers/search/${encodeURIComponent(query)}`
      );
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      }
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setSearchResults(null);
  };

  return (
    <AppProvider i18n={{}}>
      <Page title="Reseller Management">
        <Card sectioned>
          <InlineStack gap="400">
            <TextField
              label="Search"
              labelHidden
              value={query}
              onChange={setQuery}
              autoComplete="off"
              placeholder="Search resellers by name or description..."
            />
            <Button onClick={onSearch}>Search</Button>
            {searchResults && <Button onClick={clearSearch}>Clear</Button>}
          </InlineStack>
        </Card>

        {searchResults ? (
          <Card>
            <InlineStack
              align="space-between"
              blockAlign="center"
              gap="400"
              padding="400"
            >
              <p>
                Search results for "{query}" ({searchResults.length} found)
              </p>
              <Button onClick={clearSearch}>Show All</Button>
            </InlineStack>
            <div style={{ overflowX: "auto" }}>
              <DataTable
                columnContentTypes={[
                  "text",
                  "text",
                  "text",
                  "text",
                  "text",
                  "text",
                ]}
                headings={[
                  "Logo",
                  "Name",
                  "Description",
                  "Website",
                  "Location",
                  "Actions",
                ]}
                rows={searchResults.map((r) => [
                  r.logo_url
                    ? `<img src="${r.logo_url}" alt="logo" style="height:28px; width:28px; object-fit:cover; border-radius:4px"/>`
                    : "No Logo",
                  r.name || "",
                  r.description || "-",
                  r.website_url
                    ? `<a href="${r.website_url}" target="_blank" style="color:#5c6ac4; text-decoration:none;">Visit Website</a>`
                    : "-",
                  r.location_url
                    ? `<a href="${r.location_url}" target="_blank" style="color:#5c6ac4; text-decoration:none;">View Location</a>`
                    : "-",
                  `<button onclick="window.editReseller(${r.id})" style="background:#5c6ac4; color:white; border:none; padding:4px 8px; border-radius:4px; margin-right:4px; cursor:pointer;">Edit</button>
                   <button onclick="window.deleteReseller(${r.id})" style="background:#d82c0d; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Delete</button>`,
                ])}
              />
            </div>
          </Card>
        ) : (
          <ResellerTable />
        )}
      </Page>
    </AppProvider>
  );
}

// Replace existing body content and mount React
const container =
  document.getElementById("root") ||
  (() => {
    document.body.innerHTML = "<div id='root'></div>";
    return document.getElementById("root");
  })();

createRoot(container).render(<AdminApp />);
