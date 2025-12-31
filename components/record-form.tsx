"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

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
    itemDescription: string;
    rate: number;
    qty: number;
    amount: number;
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
        itemDescription: "",
        rate: 0,
        qty: 0,
        amount: 0,
        transporterName: "",
        paidOrToPay: "Paid",
        bookingType: "Standard",
        paymentDetails: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Dependent dropdown options
    const [countries, setCountries] = useState<string[]>([]);
    const [availableStates, setAvailableStates] = useState<string[]>([]);
    const [availableCities, setAvailableCities] = useState<string[]>([]);
    const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);

    // Manual entry flags
    const [manualCity, setManualCity] = useState(false);
    const [manualDistrict, setManualDistrict] = useState(false);

    // Load countries on mount
    useEffect(() => {
        fetch("/api/locations?type=countries")
            .then((res) => res.json())
            .then((data) => setCountries(data.countries || []))
            .catch((err) => console.error("Failed to load countries:", err));
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            const response = await fetch("/api/records", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    invDate: new Date(formData.invDate),
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to create record");
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
                itemDescription: "",
                rate: 0,
                qty: 0,
                amount: 0,
                transporterName: "",
                paidOrToPay: "Paid",
                bookingType: "Standard",
                paymentDetails: "",
            });

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
                        <Input
                            type="text"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleChange}
                            required
                            className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
                            placeholder="e.g., Paras Polymers"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Contact Person *
                        </label>
                        <Input
                            type="text"
                            name="contactPerson"
                            value={formData.contactPerson}
                            onChange={handleChange}
                            required
                            className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
                            placeholder="e.g., Mr. Neel"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Contact Number *
                        </label>
                        <Input
                            type="tel"
                            name="contactNo"
                            value={formData.contactNo}
                            onChange={handleChange}
                            required
                            className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
                            placeholder="+91 7201877472"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Email *
                        </label>
                        <Input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
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
                            <select
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-input text-foreground input-focus"
                            >
                                <option value="">Select country...</option>
                                {countries.map((country) => (
                                    <option key={country} value={country}>
                                        {country}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                State *
                            </label>
                            <select
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                required
                                disabled={!formData.country}
                                className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-input text-foreground input-focus disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">
                                    {formData.country
                                        ? "Select state..."
                                        : "Select country first"}
                                </option>
                                {availableStates.map((state) => (
                                    <option key={state} value={state}>
                                        {state}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                City *
                            </label>
                            <select
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                required
                                disabled={!formData.state}
                                className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-input text-foreground input-focus disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">
                                    {formData.state
                                        ? "Select city..."
                                        : "Select state first"}
                                </option>
                                {availableCities.map((city) => (
                                    <option key={city} value={city}>
                                        {city}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                District *
                            </label>
                            <select
                                name="district"
                                value={formData.district}
                                onChange={handleChange}
                                required
                                disabled={!formData.state}
                                className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-input text-foreground input-focus disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">
                                    {formData.state
                                        ? "Select district..."
                                        : "Select state first"}
                                </option>
                                {availableDistricts.map((district) => (
                                    <option key={district} value={district}>
                                        {district}
                                    </option>
                                ))}
                            </select>
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

                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Item Description *
                    </label>
                    <Textarea
                        name="itemDescription"
                        value={formData.itemDescription}
                        onChange={handleChange}
                        required
                        className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-3 min-h-24"
                        placeholder="e.g., Spare parts, Electronic components, Textile materials..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Rate (₹) *
                        </label>
                        <Input
                            type="number"
                            name="rate"
                            value={formData.rate || ""}
                            onChange={handleChange}
                            required
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
                            name="qty"
                            value={formData.qty || ""}
                            onChange={handleChange}
                            required
                            step="1"
                            className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Amount (₹) *
                        </label>
                        <Input
                            type="number"
                            name="amount"
                            value={formData.amount || ""}
                            onChange={handleChange}
                            required
                            step="0.01"
                            className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
                            placeholder="0.00"
                        />
                    </div>
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
                        <select
                            name="bookingType"
                            value={formData.bookingType}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-input text-foreground input-focus"
                        >
                            {BOOKING_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Payment Status *
                        </label>
                        <select
                            name="paidOrToPay"
                            value={formData.paidOrToPay}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-input text-foreground input-focus"
                        >
                            {PAYMENT_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Payment Details
                        </label>
                        <select
                            name="paymentDetails"
                            value={formData.paymentDetails}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-input text-foreground input-focus"
                        >
                            <option value="">Select payment details...</option>
                            {PAYMENT_DETAILS_OPTIONS.map((detail) => (
                                <option key={detail} value={detail}>
                                    {detail}
                                </option>
                            ))}
                        </select>
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
