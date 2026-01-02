"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import DownloadButton from "@/components/download-button";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Search,
} from "lucide-react";

interface Record {
    _id: string;
    [key: string]: any;
}

interface FieldVisibility {
    [key: string]: boolean;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const ALL_FIELDS = [
    "companyName",
    "itemCategory",
    "itemSubcategory",
    "city",
    "state",
    "district",
    "country",
    "contactPerson",
    "contactNo",
    "email",
    "recordRef",
    "invoiceNo",
    "invDate",
    "rate",
    "qty",
    "amount",
    "transporterName",
    "paidOrToPay",
    "bookingType",
    "paymentDetails",
];

const FIELD_LABELS: Record<string, string> = {
    companyName: "Company Name",
    contactPerson: "Contact Person",
    contactNo: "Contact Number",
    email: "Email",
    recordRef: "Record Reference",
    city: "City",
    district: "District",
    state: "State",
    country: "Country",
    invoiceNo: "Invoice Number",
    invDate: "Invoice Date",
    itemCategory: "Item Category",
    itemSubcategory: "Item Subcategory",
    rate: "Rate",
    qty: "Quantity",
    amount: "Amount",
    transporterName: "Transporter Name",
    paidOrToPay: "Paid or To Pay",
    bookingType: "Booking Type",
    paymentDetails: "Payment Details",
};

export default function RecordsTable() {
    const [records, setRecords] = useState<Record[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [visibility, setVisibility] = useState<FieldVisibility>({});
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });

    // Track applied filters separately from input values
    const [filters, setFilters] = useState({
        company: "",
        city: "",
        district: "",
        state: "",
        country: "India",
        invoiceNo: "",
        itemCategory: "",
        itemSubcategory: "",
        transporter: "",
        year: "",
        startDate: "",
        endDate: "",
    });
    const [appliedFilters, setAppliedFilters] = useState({
        company: "",
        city: "",
        district: "",
        state: "",
        country: "India",
        invoiceNo: "",
        itemCategory: "",
        itemSubcategory: "",
        transporter: "",
        year: "",
        startDate: "",
        endDate: "",
    });
    const [initialLoad, setInitialLoad] = useState(true);

    // Dropdown options for filters
    const [companies, setCompanies] = useState<string[]>([]);
    const [countries, setCountries] = useState<string[]>([]);
    const [states, setStates] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [districts, setDistricts] = useState<string[]>([]);
    const [itemCategories, setItemCategories] = useState<string[]>([]);
    const [itemSubcategories, setItemSubcategories] = useState<string[]>([]);

    const fetchRecords = useCallback(
        async (page: number, currentFilters: typeof filters) => {
            try {
                setLoading(true);

                // Build query params with filters
                const params = new URLSearchParams({
                    page: page.toString(),
                    limit: pagination.limit.toString(),
                });

                // Add filters to params
                if (currentFilters.company)
                    params.set("company", currentFilters.company);
                if (currentFilters.city)
                    params.set("city", currentFilters.city);
                if (currentFilters.district)
                    params.set("district", currentFilters.district);
                if (currentFilters.state)
                    params.set("state", currentFilters.state);
                if (currentFilters.country)
                    params.set("country", currentFilters.country);
                if (currentFilters.invoiceNo)
                    params.set("invoiceNo", currentFilters.invoiceNo);
                if (currentFilters.itemCategory)
                    params.set("itemCategory", currentFilters.itemCategory);
                if (currentFilters.itemSubcategory)
                    params.set(
                        "itemSubcategory",
                        currentFilters.itemSubcategory
                    );
                if (currentFilters.transporter)
                    params.set("transporter", currentFilters.transporter);
                if (currentFilters.year)
                    params.set("year", currentFilters.year);
                if (currentFilters.startDate)
                    params.set("startDate", currentFilters.startDate);
                if (currentFilters.endDate)
                    params.set("endDate", currentFilters.endDate);

                const [recordsRes, visibilityRes] = await Promise.all([
                    fetch(`/api/records?${params.toString()}`),
                    fetch("/api/visibility"),
                ]);

                if (!recordsRes.ok) throw new Error("Failed to fetch records");
                if (!visibilityRes.ok)
                    throw new Error("Failed to fetch visibility");

                const recordsData = await recordsRes.json();
                const visibilityData = await visibilityRes.json();

                setRecords(recordsData.records || []);
                setPagination(
                    recordsData.pagination || {
                        page: 1,
                        limit: 20,
                        total: 0,
                        totalPages: 0,
                    }
                );
                setVisibility(visibilityData.visibility.fields || {});
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "An error occurred"
                );
            } finally {
                setLoading(false);
            }
        },
        [pagination.limit]
    );

    useEffect(() => {
        fetchRecords(1, appliedFilters).then(() => setInitialLoad(false));

        // Load filter options
        fetch("/api/options?type=company")
            .then((res) => res.json())
            .then((data) => setCompanies(data.options || []))
            .catch((err) => console.error("Failed to load companies:", err));

        fetch("/api/locations?type=countries")
            .then((res) => res.json())
            .then((data) => setCountries(data.countries || []))
            .catch((err) => console.error("Failed to load countries:", err));

        fetch("/api/options?type=itemCategory")
            .then((res) => res.json())
            .then((data) => setItemCategories(data.options || []))
            .catch((err) => console.error("Failed to load categories:", err));
    }, []);

    const handleSearch = () => {
        setAppliedFilters(filters);
        fetchRecords(1, filters);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchRecords(newPage, appliedFilters);
        }
    };

    const handleFilterChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleComboboxFilterChange = (name: string, value: string) => {
        setFilters((prev) => ({ ...prev, [name]: value }));

        // Load dependent dropdowns
        if (name === "country" && value) {
            fetch(
                `/api/locations?type=states&country=${encodeURIComponent(
                    value
                )}`
            )
                .then((res) => res.json())
                .then((data) => setStates(data.states || []))
                .catch((err) => console.error("Failed to load states:", err));
        }

        if (name === "state" && value) {
            Promise.all([
                fetch(
                    `/api/locations?type=cities&state=${encodeURIComponent(
                        value
                    )}`
                ).then((r) => r.json()),
                fetch(
                    `/api/locations?type=districts&state=${encodeURIComponent(
                        value
                    )}`
                ).then((r) => r.json()),
            ])
                .then(([citiesData, districtsData]) => {
                    setCities(citiesData.cities || []);
                    setDistricts(districtsData.districts || []);
                })
                .catch((err) =>
                    console.error("Failed to load cities/districts:", err)
                );
        }

        if (name === "itemCategory" && value) {
            fetch(
                `/api/options?type=itemSubcategory_${encodeURIComponent(value)}`
            )
                .then((res) => res.json())
                .then((data) => setItemSubcategories(data.options || []))
                .catch((err) =>
                    console.error("Failed to load subcategories:", err)
                );
        }
    };

    const handleResetFilters = () => {
        const emptyFilters = {
            company: "",
            city: "",
            district: "",
            state: "",
            country: "India",
            invoiceNo: "",
            itemCategory: "",
            itemSubcategory: "",
            transporter: "",
            year: "",
            startDate: "",
            endDate: "",
        };
        setFilters(emptyFilters);
        setAppliedFilters(emptyFilters);
        fetchRecords(1, emptyFilters);
    };

    const activeFilterCount = Object.values(appliedFilters).filter(
        (v) => v !== ""
    ).length;

    const visibleColumns = ALL_FIELDS.filter(
        (field) => visibility[field] !== false
    );

    // Render filter panel (always visible) - only show filters for visible fields
    const renderFilterPanel = () => {
        const isFieldVisible = (field: string) => visibility[field] !== false;

        // Generate year options (current year and past 20 years)
        const currentYear = new Date().getFullYear();
        const yearOptions = Array.from({ length: 21 }, (_, i) =>
            (currentYear - i).toString()
        );

        return (
            <Card className="p-6 bg-card border border-border mb-6">
                <div className="mb-4">
                    <h3 className="text-sm font-semibold text-foreground">
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                {activeFilterCount} active
                            </span>
                        )}
                    </h3>
                </div>

                <div className="space-y-6">
                    {/* Items Section */}
                    {(isFieldVisible("itemCategory") ||
                        isFieldVisible("itemSubcategory")) && (
                        <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                Items
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {isFieldVisible("itemCategory") && (
                                    <Combobox
                                        options={itemCategories}
                                        value={filters.itemCategory}
                                        onChange={(value) =>
                                            handleComboboxFilterChange(
                                                "itemCategory",
                                                value
                                            )
                                        }
                                        placeholder="Item category..."
                                        allowCreate={false}
                                    />
                                )}
                                {isFieldVisible("itemSubcategory") && (
                                    <Combobox
                                        options={itemSubcategories}
                                        value={filters.itemSubcategory}
                                        onChange={(value) =>
                                            handleComboboxFilterChange(
                                                "itemSubcategory",
                                                value
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
                                )}
                            </div>
                        </div>
                    )}

                    {/* Location Section */}
                    {(isFieldVisible("state") ||
                        isFieldVisible("district") ||
                        isFieldVisible("city")) && (
                        <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                Location
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {isFieldVisible("state") && (
                                    <Combobox
                                        options={states}
                                        value={filters.state}
                                        onChange={(value) =>
                                            handleComboboxFilterChange(
                                                "state",
                                                value
                                            )
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
                                )}
                                {isFieldVisible("district") && (
                                    <Combobox
                                        options={districts}
                                        value={filters.district}
                                        onChange={(value) =>
                                            handleComboboxFilterChange(
                                                "district",
                                                value
                                            )
                                        }
                                        placeholder={
                                            filters.state
                                                ? "District..."
                                                : "Select state first"
                                        }
                                        allowCreate={false}
                                        className={
                                            !filters.state
                                                ? "opacity-50 cursor-not-allowed"
                                                : ""
                                        }
                                    />
                                )}
                                {isFieldVisible("city") && (
                                    <Combobox
                                        options={cities}
                                        value={filters.city}
                                        onChange={(value) =>
                                            handleComboboxFilterChange(
                                                "city",
                                                value
                                            )
                                        }
                                        placeholder={
                                            filters.state
                                                ? "City..."
                                                : "Select state first"
                                        }
                                        allowCreate={false}
                                        className={
                                            !filters.state
                                                ? "opacity-50 cursor-not-allowed"
                                                : ""
                                        }
                                    />
                                )}
                                {isFieldVisible("country") && (
                                    <Combobox
                                        options={countries}
                                        value={filters.country}
                                        onChange={(value) =>
                                            handleComboboxFilterChange(
                                                "country",
                                                value
                                            )
                                        }
                                        placeholder="Country..."
                                        allowCreate={false}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Company & Invoice Section */}
                    {(isFieldVisible("companyName") ||
                        isFieldVisible("invoiceNo")) && (
                        <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                Company & Invoice
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {isFieldVisible("companyName") && (
                                    <Combobox
                                        options={companies}
                                        value={filters.company}
                                        onChange={(value) =>
                                            handleComboboxFilterChange(
                                                "company",
                                                value
                                            )
                                        }
                                        placeholder="Company name..."
                                        allowCreate={false}
                                    />
                                )}
                                {isFieldVisible("invoiceNo") && (
                                    <Input
                                        type="text"
                                        name="invoiceNo"
                                        placeholder="Invoice number..."
                                        value={filters.invoiceNo}
                                        onChange={handleFilterChange}
                                        className="w-full"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Shipping & Date Section */}
                    {(isFieldVisible("transporterName") ||
                        isFieldVisible("invDate")) && (
                        <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                Shipping & Date
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {isFieldVisible("transporterName") && (
                                    <Input
                                        type="text"
                                        name="transporter"
                                        placeholder="Transporter..."
                                        value={filters.transporter}
                                        onChange={handleFilterChange}
                                        className="w-full"
                                    />
                                )}
                                {isFieldVisible("invDate") && (
                                    <>
                                        <select
                                            name="year"
                                            value={filters.year}
                                            onChange={handleFilterChange}
                                            className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        >
                                            <option value="">All Years</option>
                                            {yearOptions.map((year) => (
                                                <option key={year} value={year}>
                                                    {year}
                                                </option>
                                            ))}
                                        </select>
                                        <Input
                                            type="date"
                                            name="startDate"
                                            value={filters.startDate}
                                            onChange={handleFilterChange}
                                            placeholder="Start date"
                                            className="w-full"
                                        />
                                        <Input
                                            type="date"
                                            name="endDate"
                                            value={filters.endDate}
                                            onChange={handleFilterChange}
                                            placeholder="End date"
                                            className="w-full"
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                        <Button
                            onClick={handleSearch}
                            className="flex items-center gap-2"
                        >
                            <Search className="h-4 w-4" />
                            Search
                        </Button>
                        {activeFilterCount > 0 && (
                            <button
                                onClick={handleResetFilters}
                                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
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
                                Clear all filters
                            </button>
                        )}
                    </div>
                </div>
            </Card>
        );
    };

    if (loading && initialLoad)
        return (
            <>
                {renderFilterPanel()}
                <Card className="p-12 bg-card border border-border">
                    <div className="flex justify-center items-center flex-col gap-4">
                        <div className="w-10 h-10 border-3 border-border border-t-primary rounded-full animate-spin"></div>
                        <span className="text-muted-foreground text-sm font-medium">
                            Loading records...
                        </span>
                    </div>
                </Card>
            </>
        );
    if (error)
        return (
            <>
                {renderFilterPanel()}
                <Card className="p-8 bg-card border border-border">
                    <div className="text-center">
                        <svg
                            className="w-12 h-12 text-destructive mx-auto mb-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <p className="text-destructive font-medium">{error}</p>
                    </div>
                </Card>
            </>
        );
    if (pagination.total === 0)
        return (
            <>
                {renderFilterPanel()}
                <Card className="p-12 bg-card border border-border">
                    <div className="text-center">
                        <svg
                            className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                            {activeFilterCount > 0
                                ? "No matching records"
                                : "No records yet"}
                        </h3>
                        <p className="text-muted-foreground">
                            {activeFilterCount > 0
                                ? "Try adjusting your filters"
                                : "Create your first record to get started"}
                        </p>
                    </div>
                </Card>
            </>
        );

    return (
        <>
            {renderFilterPanel()}

            {/* Records Table */}
            <Card className="border border-border bg-card overflow-hidden">
                <div className="p-6 border-b border-border bg-secondary/5">
                    <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">
                                Your Records
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                {loading
                                    ? "Loading..."
                                    : `Showing ${records.length} of ${
                                          pagination.total
                                      } total records (Page ${
                                          pagination.page
                                      } of ${pagination.totalPages || 1})`}
                            </p>
                        </div>
                        <DownloadButton
                            filters={appliedFilters}
                            downloadType="employee"
                            label="Download"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-8 flex justify-center">
                            <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="border-b border-border bg-secondary/10">
                                <tr>
                                    {visibleColumns.map((col) => (
                                        <th
                                            key={col}
                                            className="px-6 py-3 text-left font-semibold text-foreground text-xs uppercase tracking-wider whitespace-nowrap"
                                        >
                                            {FIELD_LABELS[col]}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {records.map((record) => (
                                    <tr
                                        key={record._id}
                                        className="hover:bg-secondary/5 transition-colors"
                                    >
                                        {visibleColumns.map((col) => (
                                            <td
                                                key={col}
                                                className="px-6 py-4 text-foreground text-sm"
                                            >
                                                {col === "invDate"
                                                    ? new Date(
                                                          record[col]
                                                      ).toLocaleDateString()
                                                    : col === "amount"
                                                    ? `₹${Number(
                                                          record[col]
                                                      ).toFixed(2)}`
                                                    : col === "rate"
                                                    ? `₹${Number(
                                                          record[col]
                                                      ).toFixed(2)}`
                                                    : String(
                                                          record[col] || "-"
                                                      )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-border flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Page {pagination.page} of {pagination.totalPages} (
                            {pagination.total} total records)
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(1)}
                                disabled={pagination.page === 1}
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    handlePageChange(pagination.page - 1)
                                }
                                disabled={pagination.page === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="px-3 py-1 text-sm font-medium">
                                {pagination.page}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    handlePageChange(pagination.page + 1)
                                }
                                disabled={
                                    pagination.page === pagination.totalPages
                                }
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    handlePageChange(pagination.totalPages)
                                }
                                disabled={
                                    pagination.page === pagination.totalPages
                                }
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </>
    );
}
