import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Baby, Search } from 'lucide-react';
import { sanskritBabyNames } from '../lib/sanskrit-data';

export function BabyNamesPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'boy' | 'girl'>('all');

  const filteredNames = sanskritBabyNames.filter((name) => {
    const matchesSearch = 
      name.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      name.meaning.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGender = genderFilter === 'all' || name.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-foreground mb-4">
            <Baby className="h-8 w-8" />
          </div>
          <h1 className="mb-4">{t('babyNames.title')}</h1>
          <p className="text-muted-foreground">
            {t('babyNames.subtitle')}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('babyNames.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-border"
            />
          </div>

          {/* Gender Filter */}
          <div className="flex justify-center gap-2">
            <Button
              variant={genderFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setGenderFilter('all')}
              className={genderFilter === 'all' ? 'bg-foreground text-background' : 'border-foreground'}
            >
              {t('babyNames.all')}
            </Button>
            <Button
              variant={genderFilter === 'boy' ? 'default' : 'outline'}
              onClick={() => setGenderFilter('boy')}
              className={genderFilter === 'boy' ? 'bg-foreground text-background' : 'border-foreground'}
            >
              {t('babyNames.boy')}
            </Button>
            <Button
              variant={genderFilter === 'girl' ? 'default' : 'outline'}
              onClick={() => setGenderFilter('girl')}
              className={genderFilter === 'girl' ? 'bg-foreground text-background' : 'border-foreground'}
            >
              {t('babyNames.girl')}
            </Button>
          </div>
        </div>

        {/* Names Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNames.map((name, index) => (
            <Card key={index} className="p-6 hover:border-foreground transition-colors">
              <div className="flex items-start justify-between mb-3">
                <h3>{name.name}</h3>
                <span className="text-xs px-2 py-1 border border-border rounded">
                  {name.gender}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('babyNames.pronunciation')}: </span>
                  <span className="italic">{name.pronunciation}</span>
                </div>
                
                <div>
                  <span className="text-muted-foreground">{t('babyNames.meaning')}: </span>
                  <span>{name.meaning}</span>
                </div>
                
                <p className="text-muted-foreground pt-2 border-t border-border mt-3">
                  {name.story}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredNames.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No names found. Try adjusting your search or filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
