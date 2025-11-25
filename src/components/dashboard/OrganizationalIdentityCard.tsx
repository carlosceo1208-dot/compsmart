import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Target, Eye, Heart, TrendingUp } from 'lucide-react';
import { useCompanyIdentity } from '@/hooks/useCompanyIdentity';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export const OrganizationalIdentityCard = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: identity, isLoading } = useCompanyIdentity();

  // Don't render if not visible or no data
  if (!isLoading && (!identity || !identity.is_visible)) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200/50 hover:border-purple-300 transition-all duration-300 overflow-hidden",
        isExpanded ? "shadow-lg" : "shadow-sm"
      )}
    >
      <CardContent className="p-0">
        {/* Header - Always Visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-purple-100/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            <span className="font-semibold text-purple-900">Identidade Organizacional</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-purple-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-purple-600" />
          )}
        </button>

        {/* Expandable Content */}
        {isExpanded && identity && (
          <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
            {/* Mission */}
            {identity.mission && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-purple-600" />
                  <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wide">Missão</h4>
                </div>
                <p className="text-sm text-purple-800 leading-relaxed">{identity.mission}</p>
              </div>
            )}

            {/* Vision */}
            {identity.vision && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wide">Visão</h4>
                </div>
                <p className="text-sm text-purple-800 leading-relaxed">{identity.vision}</p>
              </div>
            )}

            {/* Values */}
            {identity.values && identity.values.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-purple-600" />
                  <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wide">Valores</h4>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {identity.values.map((value, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className="bg-purple-200/60 text-purple-900 hover:bg-purple-200 text-xs"
                    >
                      {value}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Annual Goal */}
            {identity.annual_goal_year && identity.annual_goal_description && (
              <div className="space-y-1.5 pt-2 border-t border-purple-200">
                <div className="flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-purple-600" />
                  <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wide">
                    Meta {identity.annual_goal_year}
                  </h4>
                </div>
                <p className="text-sm text-purple-800 leading-relaxed">
                  {identity.annual_goal_description}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
