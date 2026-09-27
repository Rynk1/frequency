import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search,
  Users,
  UserCheck,
  UserX,
  Crown,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react-native';
import { collection, getDocs, query, limit, orderBy, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useDataMode } from '@/hooks/useDataMode';

interface UserRecord {
  id: string;
  email: string;
  displayName?: string;
  subscriptionStatus: string;
  createdAt?: any;
  lastLoginAt?: any;
  usageStats?: {
    sessionsCompleted?: number;
    totalListeningTime?: number;
    streakDays?: number;
  };
}

export default function UsersManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination cursor state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [pageDocStack, setPageDocStack] = useState<QueryDocumentSnapshot<DocumentData>[]>([]);
  const [lastDocSnap, setLastDocSnap] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const { shouldUseFirestore } = useDataMode();

  const PAGE_SIZE = 50;

  const loadUsersPage = useCallback(async (cursorDoc: QueryDocumentSnapshot<DocumentData> | null = null, direction: 'initial' | 'next' | 'prev' = 'initial') => {
    if (!shouldUseFirestore) {
      setIsLoading(false);
      setUsers([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let q;
      if (cursorDoc) {
        q = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc'),
          startAfter(cursorDoc),
          limit(PAGE_SIZE + 1)
        );
      } else {
        q = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc'),
          limit(PAGE_SIZE + 1)
        );
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs;

      const hasMore = docs.length > PAGE_SIZE;
      setHasNextPage(hasMore);

      const pageDocs = hasMore ? docs.slice(0, PAGE_SIZE) : docs;

      const loaded: UserRecord[] = pageDocs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as any),
      }));

      setUsers(loaded);

      if (pageDocs.length > 0) {
        setLastDocSnap(pageDocs[pageDocs.length - 1]);
      } else {
        setLastDocSnap(null);
      }

      if (direction === 'initial') {
        setCurrentPage(1);
        setPageDocStack([]);
      }
    } catch (err: any) {
      console.warn('Failed to load users from Firestore:', err);
      setError(err?.message || 'Failed to load user list from database.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [shouldUseFirestore]);

  useEffect(() => {
    loadUsersPage(null, 'initial');
  }, [loadUsersPage]);

  const handleNextPage = useCallback(() => {
    if (!hasNextPage || !lastDocSnap) return;
    setPageDocStack(prev => [...prev, lastDocSnap]);
    setCurrentPage(prev => prev + 1);
    loadUsersPage(lastDocSnap, 'next');
  }, [hasNextPage, lastDocSnap, loadUsersPage]);

  const handlePrevPage = useCallback(() => {
    if (currentPage <= 1) return;
    const newStack = [...pageDocStack];
    newStack.pop();
    const prevCursor = newStack.length > 0 ? newStack[newStack.length - 1] : null;
    setPageDocStack(newStack);
    setCurrentPage(prev => Math.max(1, prev - 1));
    loadUsersPage(prevCursor, 'prev');
  }, [currentPage, pageDocStack, loadUsersPage]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPageDocStack([]);
    setCurrentPage(1);
    loadUsersPage(null, 'initial');
  }, [loadUsersPage]);

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'Unknown';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getSubscriptionLabel = (status: string): string => {
    if (status === 'premium') return 'Premium';
    if (status === 'trial') return 'Trial';
    return 'Free';
  };

  const getInitials = (email: string, name?: string): string => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || '??';
  };

  const filteredUsers = users.filter(user => {
    const name = user.displayName || user.email || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const sub = user.subscriptionStatus || 'free';
    const matchesFilter = selectedFilter === 'all' ||
                         (selectedFilter === 'premium' && sub === 'premium') ||
                         (selectedFilter === 'free' && sub === 'free') ||
                         (selectedFilter === 'trial' && sub === 'trial');
    return matchesSearch && matchesFilter;
  });

  const premiumCount = users.filter(u => u.subscriptionStatus === 'premium').length;
  const trialCount = users.filter(u => u.subscriptionStatus === 'trial').length;
  const freeCount = users.filter(u => u.subscriptionStatus === 'free' || !u.subscriptionStatus).length;

  const stats = [
    { label: 'Page Total', value: users.length.toString(), icon: <Users color="white" size={20} /> },
    { label: 'Page Premium', value: premiumCount.toString(), icon: <Crown color="white" size={20} /> },
    { label: 'Page Trial', value: trialCount.toString(), icon: <UserCheck color="white" size={20} /> },
    { label: 'Page Free', value: freeCount.toString(), icon: <UserX color="white" size={20} /> },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <LinearGradient
              colors={['#374151', '#1F2937']}
              style={styles.statGradient}
            >
              {stat.icon}
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </LinearGradient>
          </View>
        ))}
      </View>

      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search color="#9CA3AF" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users on this page..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          {['all', 'premium', 'trial', 'free'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter && styles.filterTextActive,
                ]}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#8B5CF6" />
        }
      >
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.emptyText}>Loading users (Page {currentPage})...</Text>
          </View>
        )}

        {error && !isLoading && (
          <View style={styles.errorContainer}>
            <AlertCircle color="#F87171" size={24} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
              <RefreshCw color="white" size={16} />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && !error && filteredUsers.length === 0 && (
          <Text style={styles.emptyText}>
            {users.length === 0
              ? shouldUseFirestore
                ? 'No users found. Users will appear here when they sign up.'
                : 'Switch to Cloud mode in Settings to view real user data.'
              : 'No users match your filter.'}
          </Text>
        )}

        {!isLoading && !error && filteredUsers.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Text style={styles.avatarText}>
                {getInitials(user.email, user.displayName)}
              </Text>
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.displayName || user.email?.split('@')[0] || 'Unknown'}</Text>
              <View style={styles.userMeta}>
                <Mail color="#9CA3AF" size={14} />
                <Text style={styles.userEmail}>{user.email || 'No email'}</Text>
              </View>
              <View style={styles.userMeta}>
                <Calendar color="#9CA3AF" size={14} />
                <Text style={styles.userJoined}>Joined {formatDate(user.createdAt)}</Text>
              </View>
              {user.usageStats && (
                <View style={styles.userMeta}>
                  <UserCheck color="#9CA3AF" size={14} />
                  <Text style={styles.userJoined}>
                    {user.usageStats.sessionsCompleted || 0} sessions · {user.usageStats.streakDays || 0} day streak
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.userStatus}>
              <View style={[
                styles.planBadge,
                user.subscriptionStatus === 'premium' && styles.premiumBadge,
                user.subscriptionStatus === 'trial' && styles.trialBadge,
              ]}>
                <Text style={styles.planText}>{getSubscriptionLabel(user.subscriptionStatus)}</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Cursor Pagination Controls */}
        <View style={styles.paginationRow}>
          <TouchableOpacity
            style={[styles.pageButton, currentPage <= 1 && styles.pageButtonDisabled]}
            onPress={handlePrevPage}
            disabled={currentPage <= 1 || isLoading}
          >
            <ChevronLeft color={currentPage <= 1 ? '#4B5563' : 'white'} size={18} />
            <Text style={[styles.pageButtonText, currentPage <= 1 && styles.pageButtonTextDisabled]}>Previous</Text>
          </TouchableOpacity>

          <Text style={styles.pageLabel}>Page {currentPage}</Text>

          <TouchableOpacity
            style={[styles.pageButton, !hasNextPage && styles.pageButtonDisabled]}
            onPress={handleNextPage}
            disabled={!hasNextPage || isLoading}
          >
            <Text style={[styles.pageButtonText, !hasNextPage && styles.pageButtonTextDisabled]}>Next</Text>
            <ChevronRight color={!hasNextPage ? '#4B5563' : 'white'} size={18} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
  },
  statCard: {
    width: '50%',
    padding: 8,
  },
  statGradient: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  header: {
    padding: 16,
    paddingTop: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    marginLeft: 8,
    color: 'white',
    fontSize: 16,
  },
  filters: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#374151',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  filterText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  filterTextActive: {
    color: 'white',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderRadius: 12,
    padding: 20,
    marginVertical: 12,
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    marginTop: 4,
  },
  retryText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  userEmail: {
    color: '#9CA3AF',
    fontSize: 12,
    marginLeft: 4,
  },
  userJoined: {
    color: '#9CA3AF',
    fontSize: 12,
    marginLeft: 4,
  },
  userStatus: {
    alignItems: 'flex-end',
  },
  planBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  premiumBadge: {
    backgroundColor: '#F59E0B',
  },
  trialBadge: {
    backgroundColor: '#3B82F6',
  },
  planText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
    lineHeight: 20,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    marginTop: 12,
    marginBottom: 40,
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  pageButtonDisabled: {
    backgroundColor: '#1F2937',
    opacity: 0.5,
  },
  pageButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  pageButtonTextDisabled: {
    color: '#6B7280',
  },
  pageLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
});
