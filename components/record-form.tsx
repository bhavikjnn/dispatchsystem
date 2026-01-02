"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { ITEM_CATEGORY_LIST, getSubcategories } from "@/lib/item-descriptions";

const BOOKING_TYPES = ["Standard", "Express", "Priority", "Door Delivery"];
const PAYMENT_TYPES = ["Paid", "To Pay"];
const PAYMENT_DETAILS_OPTIONS = [
    "100% Advance Received",
    "100% Against Delivery",
    "50% Advance, 50% Against Delivery",
    "NEFT Payment",
    "Credit Term 30 Days",
    "Bank Transfer",
    "Credit Card",
    "Check Payment",
];

interface ItemData {
    itemCategory: string;
    itemSubcategory: string;
    rate: number;
    qty: number;
    amount: number;
}

interface RecordFormData {
    companyName: string;
    contactPerson: string;
    contactNo: string;
    email: string;
    recordRef: string;
    city: string;
    district: string;
    state: string;
    country: string;
    invoiceNo: string;
    invDate: string;
    transporterName: string;
    paidOrToPay: "Paid" | "To Pay";
    bookingType: string;
    paymentDetails: string;
}

export default function RecordForm({ onSuccess }: { onSuccess?: () => void }) {
    const [formData, setFormData] = useState<RecordFormData>({
        companyName: "",
        contactPerson: "",
        contactNo: "",
        email: "",
        recordRef: "",
        city: "",
        district: "",
        state: "",
        country: "India",
        invoiceNo: "",
        invDate: "",
        transporterName: "",
        paidOrToPay: "Paid",
        bookingType: "Standard",
        paymentDetails: "",
    });

    const [items, setItems] = useState<ItemData[]>([
        {
            itemCategory: "",
            itemSubcategory: "",
            rate: 0,
            qty: 0,
            amount: 0,
        },
    ]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Dependent dropdown options
    const [companies, setCompanies] = useState<string[]>([]);
    const [countries, setCountries] = useState<string[]>([]);
    const [itemCategories, setItemCategories] =
        useState<string[]>(ITEM_CATEGORY_LIST);
    const [availableStates, setAvailableStates] = useState<string[]>([]);
    const [availableCities, setAvailableCities] = useState<string[]>([]);
    const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);

    // Subcategories for each item
    const [itemSubcategories, setItemSubcategories] = useState<{
        [key: number]: string[];
    }>({});

    // Load companies, countries and item categories on mount
    useEffect(() => {
        // Fetch companies from options API
        fetch("/api/options?type=company")
            .then((res) => res.json())
            .then((data) => {
                console.log("[RecordForm] Received companies:", data);
                setCompanies(data.options || []);
            })
            .catch((err) => console.error("Failed to load companies:", err));

        fetch("/api/locations?type=countries")
            .then((res) => res.json())
            .then((data) => setCountries(data.countries || []))
            .catch((err) => console.error("Failed to load countries:", err));

        // Fetch item categories from MongoDB
        console.log("[RecordForm] Fetching item categories from MongoDB...");
        fetch("/api/options?type=itemCategory")
            .then((res) => res.json())
            .then((data) => {
                console.log("[RecordForm] Received item categories:", data);
                if (data.options && data.options.length > 0) {
                    console.log(
                        `[RecordForm] Setting ${data.options.length} categories`
                    );
                    setItemCategories(data.options);
                } else {
                    console.log(
                        "[RecordForm] No categories from API, using fallback"
                    );
                }
            })
            .catch((err) => {
                console.error("Failed to load item categories:", err);
            });
    }, []);

    // Update states when country changes
    useEffect(() => {
        if (formData.country) {
            fetch(
                `/api/locations?type=states&country=${encodeURIComponent(
                    formData.country
                )}`
            )
                .then((res) => res.json())
                .then((data) => {
                    setAvailableStates(data.states || []);
                    setFormData((prev) => ({
                        ...prev,
                        state: "",
                        city: "",
                        district: "",
                    }));
                    setAvailableCities([]);
                    setAvailableDistricts([]);
                    setManualCity(false);
                    setManualDistrict(false);
                })
                .catch((err) => console.error("Failed to load states:", err));
        }
    }, [formData.country]);

    // Update cities and districts when state changes
    useEffect(() => {
        if (formData.state) {
            Promise.all([
                fetch(
                    `/api/locations?type=cities&state=${encodeURIComponent(
                        formData.state
                    )}`
                ).then((r) => r.json()),
                fetch(
                    `/api/locations?type=districts&state=${encodeURIComponent(
                        formData.state
                    )}`
                ).then((r) => r.json()),
            ])
                .then(([citiesData, districtsData]) => {
                    setAvailableCities(citiesData.cities || []);
                    setAvailableDistricts(districtsData.districts || []);
                    setFormData((prev) => ({
                        ...prev,
                        city: "",
                        district: "",
                    }));
                    setManualCity(false);
                    setManualDistrict(false);
                })
                .catch((err) =>
                    console.error("Failed to load cities/districts:", err)
                );
        }
    }, [formData.state]);

    // Load subcategories when item category changes
    const loadSubcategories = (itemIndex: number, category: string) => {
        if (category) {
            fetch(
                `/api/options?type=itemSubcategory_${encodeURIComponent(
                    category
                )}`
            )
                .then((res) => res.json())
                .then((data) => {
                    const subcats = data.options || [];
                    // Fallback to hardcoded if empty
                    if (subcats.length === 0) {
                        const hardcodedSubcats = getSubcategories(category);
                        setItemSubcategories((prev) => ({
                            ...prev,
                            [itemIndex]: hardcodedSubcats,
                        }));
                    } else {
                        setItemSubcategories((prev) => ({
                            ...prev,
                            [itemIndex]: subcats,
                        }));
                    }
                })
                .catch((err) => {
                    console.error("Failed to load subcategories:", err);
                    const hardcodedSubcats = getSubcategories(category);
                    setItemSubcategories((prev) => ({
                        ...prev,
                        [itemIndex]: hardcodedSubcats,
                    }));
                });
        } else {
            setItemSubcategories((prev) => ({
                ...prev,
                [itemIndex]: [],
            }));
        }
    };

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]:
                name === "rate" || name === "qty" || name === "amount"
                    ? Number.parseFloat(value) || 0
                    : value,
        }));
    };

    const handleComboboxChange = (name: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleItemChange = (
        index: number,
        field: keyof ItemData,
        value: string | number
    ) => {
        const newItems = [...items];
        newItems[index] = {
            ...newItems[index],
            [field]: value,
        };
        setItems(newItems);

        // Load subcategories when category changes
        if (field === "itemCategory" && typeof value === "string") {
            loadSubcategories(index, value);
            // Reset subcategory
            newItems[index].itemSubcategory = "";
            setItems(newItems);
        }
    };

    const addItem = () => {
        setItems([
            ...items,
            {
                itemCategory: "",
                itemSubcategory: "",
                rate: 0,
                qty: 0,
                amount: 0,
            },
        ]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            const newItems = items.filter((_, i) => i !== index);
            setItems(newItems);
            // Clean up subcategories
            const newSubcats = { ...itemSubcategories };
            delete newSubcats[index];
            setItemSubcategories(newSubcats);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            // Validate that at least one item has category
            const validItems = items.filter((item) => item.itemCategory);
            if (validItems.length === 0) {
                throw new Error("Please add at least one item with a category");
            }

            // Create a record for each item
            const records = validItems.map((item) => ({
                ...formData,
                ...item,
                invDate: new Date(formData.invDate),
            }));

            // Send all records in one request
            const response = await fetch("/api/records/bulk-create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ records }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to create records");
            }

            setSuccess(true);
            setFormData({
                companyName: "",
                contactPerson: "",
                contactNo: "",
                email: "",
                recordRef: "",
                city: "",
                district: "",
                state: "",
                country: "India",
                invoiceNo: "",
                invDate: "",
                transporterName: "",
                paidOrToPay: "Paid",
                bookingType: "Standard",
                paymentDetails: "",
            });
            setItems([
                {
                    itemCategory: "",
                    itemSubcategory: "",
                    rate: 0,
                    qty: 0,
                    amount: 0,
                },
            ]);
            setItemSubcategories({});

            if (onSuccess) onSuccess();

            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="p-8 bg-card border border-border">
            {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-start gap-3">
                    <svg
                        className="w-5 h-5 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <span>{error}</span>
                </div>
            )}
            {success && (
                <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg text-primary text-sm flex items-start gap-3">
                    <svg
                        className="w-5 h-5 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <span>Record created successfully!</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Company Name *
                        </label>
                        <Combobox
                            options={companies}
                            value={formData.companyName}
                            onChange={(value) =>
                                handleComboboxChange("companyName", value)
                            }
                            placeholder="Select or create company..."
                            allowCreate={true}
                            optionType="company"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Contact Person
                        </label>
                        <Input
                            type="text"
                            name="contactPerson"
                            value={formData.contactPerson}
                            onChange={handleChange}
                            className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
                            placeholder="e.g., Mr. Neel"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Contact Number
                        </label>
                        <Input
                            type="tel"
                            name="contactNo"
                            value={formData.contactNo}
                            onChange={handleChange}
                            className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
                            placeholder="+91 7201877472"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Email
                        </label>
                        <Input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
                            placeholder="john@company.com"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Record Reference *
                    </label>
                    <Input
                        type="text"
                        name="recordRef"
                        value={formData.recordRef}
                        onChange={handleChange}
                        required
                        className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
                        placeholder="e.g., By Phone"
                    />
                </div>

                <div className="border-t border-border pt-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                        Location Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Country *
                            </label>
                            <Combobox
                                options={countries}
                                value={formData.country}
                                onChange={(value) =>
                                    handleComboboxChange("country", value)
                                }
                                placeholder="Select country..."
                                allowCreate={true}
                                optionType="country"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                State *
                            </label>
                            <Combobox
                                options={availableStates}
                                value={formData.state}
                                onChange={(value) =>
                                    handleComboboxChange("state", value)
                                }
                                placeholder={
                                    formData.country
                                        ? "Select state..."
                                        : "Select country first"
                                }
                                allowCreate={true}
                                optionType="state"
                                className={
                                    !formData.country
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                }
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                City *
                            </label>
                            <Combobox
                                options={availableCities}
                                value={formData.city}
                                onChange={(value) =>
                                    handleComboboxChange("city", value)
                                }
                                placeholder={
                                    formData.state
                                        ? "Select city..."
                                        : "Select state first"
                                }
                                emptyText="No city found."
                                allowCreate={true}
                                className={
                                    !formData.state
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                }
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                District
                            </label>
                            <Combobox
                                options={availableDistricts}
                                value={formData.district}
                                onChange={(value) =>
                                    handleComboboxChange("district", value)
                                }
                                placeholder={
                                    formData.state
                                        ? "Select district..."
                                        : "Select state first"
                                }
                                emptyText="No district found."
                                allowCreate={true}
                                className={
                                    !formData.state
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                }
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Invoice Number *
                        </label>
                        <Input
                            type="text"
                            name="invoiceNo"
                            value={formData.invoiceNo}
                            onChange={handleChange}
                            required
                            className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
                            placeholder="e.g., INV-2025-001"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Invoice Date *
                        </label>
                        <Input
                            type="date"
                            name="invDate"
                            value={formData.invDate}
                            onChange={handleChange}
                            required
                            className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
                        />
                    </div>
                </div>

                <div className="border-t border-border pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-foreground">
                            Items
                        </h3>
                        <Button
                            type="button"
                            onClick={addItem}
                            className="button-secondary flex items-center gap-2"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            Add Item
                        </Button>
                    </div>

                    {items.map((item, index) => (
                        <div
                            key={index}
                            className="mb-6 p-4 border border-border rounded-lg bg-secondary/5"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-sm font-semibold text-foreground">
                                    Item {index + 1}
                                </h4>
                                {items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="text-destructive hover:text-destructive/80 text-sm flex items-center gap-1"
                                    >
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                        </svg>
                                        Remove
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Item Category *
                                    </label>
                                    <Combobox
                                        options={itemCategories}
                                        value={item.itemCategory}
                                        onChange={(value) =>
                                            handleItemChange(
                                                index,
                                                "itemCategory",
                                                value
                                            )
                                        }
                                        placeholder="Select category..."
                                        allowCreate={true}
                                        optionType="itemCategory"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Item Subcategory
                                    </label>
                                    <Combobox
                                        options={itemSubcategories[index] || []}
                                        value={item.itemSubcategory}
                                        onChange={(value) =>
                                            handleItemChange(
                                                index,
                                                "itemSubcategory",
                                                value
                                            )
                                        }
                                        placeholder={
                                            item.itemCategory
                                                ? "Select subcategory..."
                                                : "Select category first"
                                        }
                                        allowCreate={true}
                                        optionType={
                                            item.itemCategory
                                                ? `itemSubcategory_${item.itemCategory}`
                                                : undefined
                                        }
                                        className={
                                            !item.itemCategory
                                                ? "opacity-50 cursor-not-allowed"
                                                : ""
                                        }
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Rate (₹)
                                    </label>
                                    <Input
                                        type="number"
                                        value={item.rate || ""}
                                        onChange={(e) =>
                                            handleItemChange(
                                                index,
                                                "rate",
                                                Number.parseFloat(
                                                    e.target.value
                                                ) || 0
                                            )
                                        }
                                        step="0.01"
                                        className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Quantity *
                                    </label>
                                    <Input
                                        type="number"
                                        value={item.qty || ""}
                                        onChange={(e) =>
                                            handleItemChange(
                                                index,
                                                "qty",
                                                Number.parseInt(
                                                    e.target.value,
                                                    10
                                                ) || 0
                                            )
                                        }
                                        required
                                        step="1"
                                        className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Amount (₹)
                                    </label>
                                    <Input
                                        type="number"
                                        value={item.amount || ""}
                                        onChange={(e) =>
                                            handleItemChange(
                                                index,
                                                "amount",
                                                Number.parseFloat(
                                                    e.target.value
                                                ) || 0
                                            )
                                        }
                                        step="0.01"
                                        className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Transporter Name *
                        </label>
                        <Input
                            type="text"
                            name="transporterName"
                            value={formData.transporterName}
                            onChange={handleChange}
                            required
                            className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
                            placeholder="e.g., DTDC Courier"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Booking Type *
                        </label>
                        <Combobox
                            options={BOOKING_TYPES}
                            value={formData.bookingType}
                            onChange={(value) =>
                                handleComboboxChange("bookingType", value)
                            }
                            placeholder="Select booking type..."
                            emptyText="No booking type found."
                            allowCreate={true}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Payment Status
                        </label>
                        <Combobox
                            options={PAYMENT_TYPES}
                            value={formData.paidOrToPay}
                            onChange={(value) =>
                                handleComboboxChange("paidOrToPay", value)
                            }
                            placeholder="Select payment status..."
                            emptyText="No payment status found."
                            allowCreate={false}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Payment Details
                        </label>
                        <Combobox
                            options={PAYMENT_DETAILS_OPTIONS}
                            value={formData.paymentDetails}
                            onChange={(value) =>
                                handleComboboxChange("paymentDetails", value)
                            }
                            placeholder="Select payment details..."
                            emptyText="No payment details found."
                            allowCreate={true}
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full button-primary py-2 rounded-lg font-medium"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                            Creating...
                        </span>
                    ) : (
                        "Create Record"
                    )}
                </Button>
            </form>
        </Card>
    );
}
