import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { createCheckoutSession, getSubscriptionStatus } from '../../services/stripeService';
import stripePromise from '../../lib/stripeClient';
import './Settings.css';

interface UserData {
  user_id: string;
  email: string | undefined;
  first_name: string | undefined;
  avatar_url: string | undefined;
}

const Settings = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('billing');
  const [userData, setUserData] = useState<UserData>({
    user_id: '',
    email: undefined,
    first_name: undefined,
    avatar_url: undefined
  });
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('none');
  const [isLoadingCheckout, setIsLoadingCheckout] = useState<boolean>(false);

  useEffect(() => {
    fetchUserData();
    fetchSubscriptionStatus();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { email } = session.user;
        
        console.log('Current user ID:', session.user.id);
        
        // Fetch user data from the database
        const { data: userData, error } = await supabase
          .from('userData')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
          
        if (error) {
          console.error('Error fetching user data:', error);
          setMessage({ text: 'Failed to load profile data', type: 'error' });
          return;
        }

        console.log('User data from database:', userData);
        console.log('User email from session:', email);

        // Update state with user data
        setUserData({
          user_id: session.user.id,
          email: email || undefined,
          first_name: userData?.first_name || undefined,
          avatar_url: userData?.avatar_url || undefined
        });
        
        // Set the new name state for editing
        setNewName(userData?.first_name || '');
        // Set the new email state for editing
        setNewEmail(email || '');
      }
    } catch (error) {
      console.error('Error in fetchUserData:', error);
      setMessage({ text: 'Failed to load profile data', type: 'error' });
    }
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const status = await getSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      setMessage({ text: 'Name cannot be empty', type: 'error' });
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('No authenticated user found');
      }

      // Update the name in the database
      const { error } = await supabase
        .from('userData')
        .update({ first_name: newName })
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // Update local state
      setUserData(prev => ({ ...prev, first_name: newName }));
      setMessage({ text: 'Name updated successfully', type: 'success' });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating name:', error);
      setMessage({ text: 'Failed to update name', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || !userData?.email) return;
    
    // Don't update if email hasn't changed
    if (newEmail === userData.email) {
      setIsEditingEmail(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setMessage({ text: 'Please enter a valid email address', type: 'error' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // First, update the auth email - this will trigger a confirmation email
      const { data, error: authError } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (authError) {
        console.error('Error updating auth email:', authError);
        throw new Error(`Failed to update auth email: ${authError.message}`);
      }

      // Check if email confirmation is required
      if (data?.user?.email !== newEmail) {
        // Email change requires confirmation
        setMessage({ 
          text: 'A confirmation email has been sent to your new email address. Please check your inbox and click the confirmation link to complete the change.', 
          type: 'success' 
        });
        setIsEditingEmail(false);
        return;
      }

      // If we get here, the email was updated without requiring confirmation
      // Update the userData table
      const { error: dbError } = await supabase
        .from('userData')
        .update({ email: newEmail })
        .eq('user_id', userData.user_id);

      if (dbError) {
        console.error('Error updating userData email:', dbError);
        throw new Error(`Failed to update userData email: ${dbError.message}`);
      }

      // Update local state
      setUserData(prev => ({ ...prev, email: newEmail }));
      setIsEditingEmail(false);
      setMessage({ 
        text: 'Email updated successfully.', 
        type: 'success' 
      });
    } catch (error: any) {
      console.error('Error updating email:', error);
      setMessage({ text: error.message || 'Failed to update email', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      const { error } = await supabase.auth.resetPasswordForEmail(
        session.user.email,
        { redirectTo: `${window.location.origin}/update-password` }
      );
      
      if (error) {
        setMessage({ text: 'Failed to send password reset email', type: 'error' });
      } else {
        setMessage({ text: 'Password reset email sent', type: 'success' });
      }
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setMessage(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('No authenticated user found');
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size exceeds 5MB limit');
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log('Uploading file to path:', filePath);

      // Upload the file to storage
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload avatar: ${uploadError.message}`);
      }

      console.log('Upload successful, data:', data);

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);

      // Update the user's profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('userData')
        .update({ avatar_url: publicUrl })
        .eq('user_id', session.user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      // Update local state
      setUserData(prev => ({ ...prev, avatar_url: publicUrl }));
      setMessage({ text: 'Avatar updated successfully', type: 'success' });
    } catch (error: any) {
      console.error('Error in handleAvatarUpload:', error);
      setMessage({ text: error.message || 'Failed to upload avatar', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          throw new Error('No authenticated user found');
        }

        // Delete user data from userData table
        const { error: deleteDataError } = await supabase
          .from('userData')
          .delete()
          .eq('user_id', session.user.id);

        if (deleteDataError) {
          console.error('Error deleting user data:', deleteDataError);
        }

        // Delete user from auth
        const { error } = await supabase.auth.admin.deleteUser(session.user.id);

        if (error) {
          setMessage({ text: 'Failed to delete account', type: 'error' });
        } else {
          await supabase.auth.signOut();
          navigate('/login');
        }
      } catch (error) {
        console.error('Error deleting account:', error);
        setMessage({ text: 'Failed to delete account', type: 'error' });
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleBackToChat = () => {
    navigate('/chat');
  };

  const handleUpgrade = async (priceId: string) => {
    setIsLoadingCheckout(true);
    setMessage(null);
    
    try {
      const successUrl = `${window.location.origin}/settings?success=true`;
      const cancelUrl = `${window.location.origin}/settings?canceled=true`;
      
      const session = await createCheckoutSession(priceId, successUrl, cancelUrl);
      
      // Redirect to Stripe Checkout
      window.location.href = session.url;
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      setMessage({ text: error.message || 'Failed to start checkout process', type: 'error' });
      setIsLoadingCheckout(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-sidebar">
        <div className="sidebar-top">
          <div className="back-button" onClick={handleBackToChat} title="Back to Chat">
            ←
          </div>
          <div className="logo">
            <img src="/logo-black.png" alt="Mentar" />
          </div>
        </div>
        <div className="menu-items">
          <div
            className={`menu-item ${activeSection === 'billing' ? 'active' : ''}`}
            onClick={() => setActiveSection('billing')}
          >
            Billing
          </div>
          <div
            className={`menu-item ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveSection('profile')}
          >
            Profile
          </div>
          <div className="menu-item" onClick={handleLogout}>
            Log out
          </div>
        </div>
      </div>

      <div className="settings-content">
        {activeSection === 'billing' && (
          <div className="billing-section">
            <h1>Billing</h1>
            <p className="current-plan">
              You are currently using <span>{subscriptionStatus === 'pro' ? 'Pro' : 'Free'}</span>
            </p>
            
            <div className="pricing-cards">
              <div className="pricing-card">
                <h2>Free Plan</h2>
                <div className="price">Free</div>
                <ul className="features">
                  <li>Limited Use</li>
                  <li>1 Project</li>
                  <li>Basic Model</li>
                </ul>
                <button 
                  className={subscriptionStatus === 'none' ? 'current-plan-btn' : 'upgrade-btn'} 
                  disabled={subscriptionStatus === 'none' || isLoadingCheckout}
                >
                  {subscriptionStatus === 'none' ? 'Current' : 'Downgrade'}
                </button>
              </div>

              <div className="pricing-card">
                <h2>Pro Monthly</h2>
                <div className="price">$29</div>
                <div className="price-period">Per Month</div>
                <ul className="features">
                  <li>Unlimited Use</li>
                  <li>Unlimited Projects</li>
                  <li>Advanced Model</li>
                </ul>
                <button 
                  className={subscriptionStatus === 'pro_monthly' ? 'current-plan-btn' : 'upgrade-btn'} 
                  onClick={() => handleUpgrade('price_1RBPNaC2nY5YUxjH2eJVVHfZ')}
                  disabled={subscriptionStatus === 'pro_monthly' || isLoadingCheckout}
                >
                  {subscriptionStatus === 'pro_monthly' ? 'Current' : 'Upgrade'}
                </button>
              </div>

              <div className="pricing-card featured">
                <div className="discount-badge">43% OFF</div>
                <h2>Pro Annually</h2>
                <div className="price">$197</div>
                <div className="price-period">One-time Fee</div>
                <ul className="features">
                  <li>Unlimited Use</li>
                  <li>Unlimited Projects</li>
                  <li>Advanced Model</li>
                </ul>
                <button 
                  className={subscriptionStatus === 'pro_annual' ? 'current-plan-btn' : 'upgrade-btn'} 
                  onClick={() => handleUpgrade('price_1RBPO8C2nY5YUxjHEQLICLwR')}
                  disabled={subscriptionStatus === 'pro_annual' || isLoadingCheckout}
                >
                  {subscriptionStatus === 'pro_annual' ? 'Current' : 'Upgrade'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'profile' && (
          <div className="profile-section">
            <h1>Profile</h1>
            {message && (
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
            )}
            <div className="profile-info">
              <div className="profile-picture">
                <div className="avatar">
                  {userData.avatar_url ? (
                    <img src={userData.avatar_url} alt="Profile" />
                  ) : (
                    <div className="avatar-placeholder">
                      {userData.first_name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <button 
                  className="upload-button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  Upload Photo
                </button>
              </div>

              <div className="profile-field">
                <label>First Name</label>
                {isEditing ? (
                  <div className="edit-field">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="edit-input"
                      placeholder="Enter your first name"
                    />
                    <div className="edit-actions">
                      <button 
                        onClick={handleUpdateName}
                        disabled={isLoading}
                        className="save-button"
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => {
                          setIsEditing(false);
                          setNewName(userData.first_name || '');
                        }}
                        className="cancel-button"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="profile-value">
                    {userData.first_name ? userData.first_name : 'Not set'}
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="edit-button"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              <div className="profile-field">
                <label>Email</label>
                {isEditingEmail ? (
                  <div className="edit-field">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="edit-input"
                      placeholder="Enter your email"
                    />
                    <div className="edit-actions">
                      <button 
                        onClick={handleUpdateEmail}
                        disabled={isLoading}
                        className="save-button"
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => {
                          setIsEditingEmail(false);
                          setNewEmail(userData.email || '');
                        }}
                        className="cancel-button"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="email-confirmation-note">
                      Note: You will need to confirm your new email address by clicking a link sent to your inbox.
                    </div>
                  </div>
                ) : (
                  <div className="profile-value">
                    {userData.email ? userData.email : 'Not set'}
                    <button 
                      onClick={() => setIsEditingEmail(true)}
                      className="edit-button"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              <div className="profile-actions">
                <button 
                  onClick={handlePasswordReset}
                  className="action-button"
                  disabled={isLoading}
                >
                  Change Password
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  className="action-button delete-account"
                  disabled={isLoading}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings; 