"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ComboboxProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    allowCreate?: boolean;
    optionType?: string; // For saving to MongoDB
}

export function Combobox({
    options,
    value,
    onChange,
    placeholder = "Select option...",
    className,
    allowCreate = true,
    optionType,
}: ComboboxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    const filteredOptions = options.filter((option) =>
        option.toLowerCase().includes(inputValue.toLowerCase())
    );

    const showCreateOption =
        allowCreate &&
        inputValue &&
        !filteredOptions.some(
            (option) => option.toLowerCase() === inputValue.toLowerCase()
        );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onChange(newValue);
        setIsOpen(true);
    };

    const handleSelectOption = async (
        option: string,
        isNew: boolean = false
    ) => {
        setInputValue(option);
        onChange(option);
        setIsOpen(false);
        inputRef.current?.blur();

        // Save new option to MongoDB
        if (isNew && optionType) {
            try {
                await fetch("/api/options", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: optionType, value: option }),
                });
            } catch (error) {
                console.error("Failed to save option:", error);
            }
        }
    };

    const handleInputFocus = () => {
        setIsOpen(true);
    };

    const handleInputBlur = () => {
        // Delay to allow click on dropdown item
        setTimeout(() => {
            setIsOpen(false);
        }, 200);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="relative w-full">
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder={placeholder}
                className={cn(
                    "w-full px-4 py-2 border border-border rounded-lg text-sm bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                    className
                )}
            />
            {isOpen && (filteredOptions.length > 0 || showCreateOption) && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-auto"
                >
                    {filteredOptions.map((option, index) => (
                        <div
                            key={index}
                            onClick={() => handleSelectOption(option)}
                            className={cn(
                                "px-4 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                                option === value && "bg-accent/50"
                            )}
                        >
                            {option}
                        </div>
                    ))}
                    {showCreateOption && (
                        <div
                            onClick={() => handleSelectOption(inputValue, true)}
                            className="px-4 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground border-t border-border text-primary"
                        >
                            Create "{inputValue}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
