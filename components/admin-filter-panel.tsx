"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";

interface FilterPanelProps {
    onFilter: (filters: Record<string, any>) => void;
}

export default function AdminFilterPanel({ onFilter }: FilterPanelProps) {
    const [filters, setFilters] = useState({
        itemCategory: "",
        itemSubcategory: "",
        state: "",
        district: "",
        city: "",
        country: "India",
        company: "",
        invoiceNo: "",
        transporter: "",
        year: "",
        startDate: "",
        endDate: "",
        uniqueCompanyOnly: false,
    });

    const [companies, setCompanies] = useState<string[]>([]);
    const [countries, setCountries] = useState<string[]>([]);
    const [states, setStates] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [districts, setDistricts] = useState<string[]>([]);
    const [allDistricts, setAllDistricts] = useState<string[]>([]);
    const [allCities, setAllCities] = useState<string[]>([]);
    const [itemCategories, setItemCategories] = useState<string[]>([]);
    const [itemSubcategories, setItemSubcategories] = useState<string[]>([]);

    useEffect(() => {
        // Load initial options and auto-load India states
        fetch("/api/locations?type=countries")
            .then((res) => res.json())
            .then((data) => setCountries(data.countries || []))
            .catch((err) => console.error("Failed to load countries:", err));

        // Auto-load India states on mount
        fetch(
            `/api/locations?type=states&country=${encodeURIComponent("India")}`,
        )
            .then((res) => res.json())
            .then((data) => setStates(data.states || []))
            .catch((err) => console.error("Failed to load states:", err));

        fetch("/api/locations?type=cities")
            .then((res) => res.json())
            .then((data) => {
                const cityList = data.cities || [];
                setAllCities(cityList);
                setCities(cityList);
            })
            .catch((err) => console.error("Failed to load cities:", err));

        fetch("/api/locations?type=districts")
            .then((res) => res.json())
            .then((data) => {
                const districtList = data.districts || [];
                setAllDistricts(districtList);
                setDistricts(districtList);
            })
            .catch((err) => console.error("Failed to load districts:", err));

        fetch("/api/options?type=company")
            .then((res) => res.json())
            .then((data) => setCompanies(data.options || []))
            .catch((err) => console.error("Failed to load companies:", err));

        fetch("/api/options?type=itemCategory")
            .then((res) => res.json())
            .then((data) => setItemCategories(data.options || []))
            .catch((err) => console.error("Failed to load categories:", err));
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleComboboxChange = (name: string, value: string) => {
        setFilters((prev) => ({ ...prev, [name]: value }));

        // Load dependent dropdowns
        if (name === "country" && value) {
            fetch(
                `/api/locations?type=states&country=${encodeURIComponent(
                    value,
                )}`,
            )
                .then((res) => res.json())
                .then((data) => setStates(data.states || []))
                .catch((err) => console.error("Failed to load states:", err));
        }

        if (name === "state") {
            if (value) {
                Promise.all([
                    fetch(
                        `/api/locations?type=cities&state=${encodeURIComponent(
                            value,
                        )}`,
                    ).then((r) => r.json()),
                    fetch(
                        `/api/locations?type=districts&state=${encodeURIComponent(
                            value,
                        )}`,
                    ).then((r) => r.json()),
                ])
                    .then(([citiesData, districtsData]) => {
                        setCities(citiesData.cities || []);
                        setDistricts(districtsData.districts || []);
                    })
                    .catch((err) =>
                        console.error("Failed to load cities/districts:", err),
                    );
            } else {
                setCities(allCities);
                setDistricts(allDistricts);
            }
        }

        if (name === "itemCategory" && value) {
            fetch(
                `/api/options?type=itemSubcategory_${encodeURIComponent(value)}`,
            )
                .then((res) => res.json())
                .then((data) => setItemSubcategories(data.options || []))
                .catch((err) =>
                    console.error("Failed to load subcategories:", err),
                );
        }
    };

    const handleApplyFilters = () => {
        onFilter(filters);
    };

    const handleReset = () => {
        setFilters({
            itemCategory: "",
            itemSubcategory: "",
            state: "",
            district: "",
            city: "",
            country: "India",
            company: "",
            invoiceNo: "",
            transporter: "",
            year: "",
            startDate: "",
            endDate: "",
            uniqueCompanyOnly: false,
        });
        setCities(allCities);
        setDistricts(allDistricts);
        onFilter({});
    };

    const activeFilterCount = Object.values(filters).filter(
        (v) => v !== "",
    ).length;

    return (
        <Card className="p-8 bg-card border border-border">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                        Filter Records
                    </h3>
                    <p className="text-muted-foreground text-sm">
                        {activeFilterCount > 0
                            ? `${activeFilterCount} active filter${
                                  activeFilterCount !== 1 ? "s" : ""
                              }`
                            : "Refine your search using the filters below"}
                    </p>
                </div>
            </div>

            <div className="space-y-6 mb-6">
                {/* Items Section */}
                <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Items
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Combobox
                                options={itemCategories}
                                value={filters.itemCategory}
                                onChange={(value) =>
                                    handleComboboxChange("itemCategory", value)
                                }
                                placeholder="Item category..."
                                allowCreate={false}
                            />
                        </div>
                        <div>
                            <Combobox
                                options={itemSubcategories}
                                value={filters.itemSubcategory}
                                onChange={(value) =>
                                    handleComboboxChange(
                                        "itemSubcategory",
                                        value,
                                    )
                                }
                                placeholder={
                                    filters.itemCategory
                                        ? "Item subcategory..."
                                        : "Select category first"
                                }
                                allowCreate={false}
                                className={
                                    !filters.itemCategory
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                }
                            />
                        </div>
                    </div>
                </div>

                {/* Location Section */}
                <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Location
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Combobox
                                options={states}
                                value={filters.state}
                                onChange={(value) =>
                                    handleComboboxChange("state", value)
                                }
                                placeholder={
                                    filters.country
                                        ? "State..."
                                        : "Select country first"
                                }
                                allowCreate={false}
                                className={
                                    !filters.country
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                }
                            />
                        </div>
                        <div>
                            <Combobox
                                options={districts}
                                value={filters.district}
                                onChange={(value) =>
                                    handleComboboxChange("district", value)
                                }
                                placeholder={
                                    filters.state
                                        ? "District..."
                                        : "District (all states)"
                                }
                                allowCreate={false}
                            />
                        </div>
                        <div>
                            <Combobox
                                options={cities}
                                value={filters.city}
                                onChange={(value) =>
                                    handleComboboxChange("city", value)
                                }
                                placeholder={
                                    filters.state
                                        ? "City..."
                                        : "City (all states)"
                                }
                                allowCreate={false}
                            />
                        </div>
                        <div>
                            <Combobox
                                options={countries}
                                value={filters.country}
                                onChange={(value) =>
                                    handleComboboxChange("country", value)
                                }
                                placeholder="Country..."
                                allowCreate={false}
                            />
                        </div>
                    </div>
                </div>

                {/* Company & Invoice Section */}
                <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Company & Invoice
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Combobox
                                options={companies}
                                value={filters.company}
                                onChange={(value) =>
                                    handleComboboxChange("company", value)
                                }
                                placeholder="Company name..."
                                allowCreate={false}
                            />
                        </div>
                        <div>
                            <Input
                                type="text"
                                name="invoiceNo"
                                placeholder="Invoice number..."
                                value={filters.invoiceNo}
                                onChange={handleChange}
                                className="w-full"
                            />
                        </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="uniqueCompanyOnly"
                            checked={filters.uniqueCompanyOnly}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    uniqueCompanyOnly: e.target.checked,
                                }))
                            }
                            className="w-4 h-4 text-primary bg-input border-border rounded focus:ring-primary focus:ring-2"
                        />
                        <label
                            htmlFor="uniqueCompanyOnly"
                            className="text-sm text-foreground cursor-pointer select-none"
                        >
                            Show only unique company names
                        </label>
                    </div>
                </div>

                {/* Shipping & Date Section */}
                <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Shipping & Date
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Input
                                type="text"
                                name="transporter"
                                value={filters.transporter}
                                onChange={handleChange}
                                placeholder="Transporter..."
                                className="w-full"
                            />
                        </div>
                        <div>
                            <select
                                name="year"
                                value={filters.year}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="">All Years</option>
                                {Array.from({ length: 21 }, (_, i) =>
                                    (new Date().getFullYear() - i).toString(),
                                ).map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Input
                                type="date"
                                name="startDate"
                                value={filters.startDate}
                                onChange={handleChange}
                                placeholder="Start date..."
                                className="w-full"
                            />
                        </div>
                        <div>
                            <Input
                                type="date"
                                name="endDate"
                                value={filters.endDate}
                                onChange={handleChange}
                                placeholder="End date..."
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-3 flex-wrap">
                <Button
                    onClick={handleApplyFilters}
                    className="button-primary flex items-center gap-2"
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
                            d="M3 4a1 1 0 00-1 1v2c0 .552.224 1.052.586 1.414l9 9a1 1 0 001.414 0l9-9A1.414 1.414 0 0022 7V5a1 1 0 00-1-1h-2c-.552 0-1.052.224-1.414.586l-9 9a1 1 0 01-1.414 0l-9-9A1.414 1.414 0 003 4z"
                        />
                    </svg>
                    Apply Filters
                </Button>
                <Button
                    onClick={handleReset}
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
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                    Reset
                </Button>
            </div>
        </Card>
    );
}
