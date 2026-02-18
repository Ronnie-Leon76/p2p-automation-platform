/**
 * Data Refresh Control Component
 * Provides UI for managing exchange data refresh with status indicators
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DataType } from "@/lib/services/exchange-data-service";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  Clock,
  Database,
  RefreshCw,
  Settings,
  TrendingUp,
  Wifi,
} from "lucide-react";
import { useEffect, useState } from "react";

export interface DataRefreshControlProps {
  isRefreshing: boolean;
  lastRefresh: string | null;
  onRefresh: () => Promise<void>;
  onRefreshDataType: (dataType: DataType) => Promise<any>;
  onClearCache: () => Promise<void>;
  getDataStatus: () => Promise<any>;
  errors: Record<DataType, string | null>;
  className?: string;
}

export function DataRefreshControl({
  isRefreshing,
  lastRefresh,
  onRefresh,
  onRefreshDataType,
  onClearCache,
  getDataStatus,
  errors,
  className,
}: DataRefreshControlProps) {
  const [dataStatus, setDataStatus] = useState<any>(null);
  const [expandedView, setExpandedView] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);

  // Load data status
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const status = await getDataStatus();
        setDataStatus(status);
      } catch (error) {
        console.error("Error loading data status:", error);
      }
    };

    loadStatus();

    // Refresh status every 30 seconds
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, [lastRefresh]); // Remove getDataStatus from dependencies to prevent infinite loops

  // Simulate progress during refresh
  useEffect(() => {
    if (isRefreshing) {
      setRefreshProgress(0);
      const interval = setInterval(() => {
        setRefreshProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);

      return () => clearInterval(interval);
    } else {
      setRefreshProgress(100);
      setTimeout(() => setRefreshProgress(0), 1000);
    }
  }, [isRefreshing]);

  const getDataTypeIcon = (dataType: DataType) => {
    const icons = {
      profile: <Database className="h-4 w-4" />,
      merchant_profile: <TrendingUp className="h-4 w-4" />,
      balance: <Wifi className="h-4 w-4" />,
      payment_methods: <Settings className="h-4 w-4" />,
      orders: <Clock className="h-4 w-4" />,
      ads: <TrendingUp className="h-4 w-4" />,
    };
    return icons[dataType] || <Database className="h-4 w-4" />;
  };

  const getDataTypeLabel = (dataType: DataType) => {
    const labels = {
      profile: "Basic Profile",
      merchant_profile: "Merchant Profile",
      balance: "Account Balance",
      payment_methods: "Payment Methods",
      orders: "Order History",
      ads: "Advertisements",
    };
    return labels[dataType] || dataType;
  };

  const getStatusBadge = (dataType: DataType) => {
    const error = errors[dataType];
    const status = dataStatus?.[dataType];

    if (error) {
      return (
        <Badge variant="destructive" className="text-xs">
          Error
        </Badge>
      );
    }

    if (!status?.exists) {
      return (
        <Badge variant="outline" className="text-xs">
          No Data
        </Badge>
      );
    }

    if (status.isStale) {
      return (
        <Badge variant="secondary" className="text-xs">
          Stale
        </Badge>
      );
    }

    return (
      <Badge variant="default" className="text-xs bg-green-500">
        Fresh
      </Badge>
    );
  };

  const hasErrors = Object.values(errors).some((error) => error !== null);
  const staleCount = dataStatus
    ? Object.values(dataStatus).filter((s: any) => s?.isStale).length
    : 0;

  return (
    <Card className={`border-0 shadow-sm bg-white ${className}`}>
      <CardHeader className="border-b border-gray-100 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <RefreshCw
              className={`h-5 w-5 ${
                isRefreshing ? "animate-spin text-blue-600" : "text-gray-600"
              }`}
            />
            Data Refresh Control
          </CardTitle>

          <div className="flex items-center gap-2">
            {staleCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {staleCount} Stale
              </Badge>
            )}

            {hasErrors && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Errors
              </Badge>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedView(!expandedView)}
            >
              {expandedView ? "Collapse" : "Expand"}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {isRefreshing && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Refreshing data...</span>
              <span>{Math.round(refreshProgress)}%</span>
            </div>
            <Progress value={refreshProgress} className="h-2" />
          </div>
        )}

        {/* Last Refresh Info */}
        {lastRefresh && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
            <Clock className="h-4 w-4" />
            <span>
              Last updated{" "}
              {formatDistanceToNow(new Date(lastRefresh), { addSuffix: true })}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4">
        {/* Quick Actions */}
        <div className="flex items-center gap-2 mb-4">
          <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            size="sm"
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh All Data
          </Button>

          <Button
            onClick={onClearCache}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Database className="h-4 w-4" />
            Clear Cache
          </Button>
        </div>

        {/* Expanded Data Type Controls */}
        {expandedView && (
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Individual Data Controls
            </h4>

            {(
              [
                "profile",
                "merchant_profile",
                "balance",
                "payment_methods",
              ] as DataType[]
            ).map((dataType) => (
              <div
                key={dataType}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getDataTypeIcon(dataType)}
                  <div>
                    <div className="text-sm font-medium">
                      {getDataTypeLabel(dataType)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {dataStatus?.[dataType]?.expiresAt && (
                        <>
                          Expires{" "}
                          {formatDistanceToNow(
                            new Date(dataStatus[dataType].expiresAt),
                            { addSuffix: true }
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(dataType)}

                  <Button
                    onClick={() => onRefreshDataType(dataType)}
                    disabled={isRefreshing}
                    variant="outline"
                    size="sm"
                    className="gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Refresh
                  </Button>
                </div>
              </div>
            ))}

            {/* Error Details */}
            {hasErrors && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 font-medium text-sm mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  Data Errors
                </div>
                <div className="space-y-1">
                  {Object.entries(errors).map(
                    ([dataType, error]) =>
                      error && (
                        <div key={dataType} className="text-xs text-red-600">
                          <strong>
                            {getDataTypeLabel(dataType as DataType)}:
                          </strong>{" "}
                          {error}
                        </div>
                      )
                  )}
                </div>
              </div>
            )}

            {/* Data Status Summary */}
            {dataStatus && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-700 mb-2">
                  Cache Status Summary
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span>Total datasets:</span>
                    <span className="font-medium">
                      {Object.keys(dataStatus).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fresh data:</span>
                    <span className="font-medium text-green-600">
                      {
                        Object.values(dataStatus).filter(
                          (s: any) => s?.exists && !s?.isStale
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stale data:</span>
                    <span className="font-medium text-yellow-600">
                      {
                        Object.values(dataStatus).filter((s: any) => s?.isStale)
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Missing data:</span>
                    <span className="font-medium text-red-600">
                      {
                        Object.values(dataStatus).filter((s: any) => !s?.exists)
                          .length
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
