import { useEffect, useState } from 'react';
import { getMyJoinedHubs, getMyHubAsOwner } from '@/services/FanHubController';
import { getFanHubModel, uploadFanHubModel } from '@/services/VtuberModelController';

const SUPPORTED_STATES = ['idle', 'intro', 'action', 'walkLeft', 'walkRight', 'grab'];

const transformModel = (data, fanHubId) => ({
  ...data,
  fanHubId,
  frameWidth: data.frameWidth || (data.name === 'Gold Ship' ? 350 : 300),
  frameHeight: data.frameHeight || (data.name === 'Gold Ship' ? 350 : 300)
});

const buildDefaultForm = () => ({
  name: '',
  sprites: SUPPORTED_STATES.reduce((acc, state) => ({
    ...acc,
    [state]: { file: null, totalFrames: '' }
  }), {})
});

export default function PetSelectionList() {
  const [selectedPet, setSelectedPet] = useState(null);
  const [joinedHubs, setJoinedHubs] = useState([]);
  const [hubModels, setHubModels] = useState({});
  const [ownedHub, setOwnedHub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creationForm, setCreationForm] = useState(buildDefaultForm());
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const savedPet = sessionStorage.getItem('selectedPet');
    if (savedPet) {
      setSelectedPet(savedPet);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch joined hubs
        const joined = await getMyJoinedHubs();
        setJoinedHubs(joined);

        // Fetch owned hub
        const owned = await getMyHubAsOwner();
        setOwnedHub(owned);

        // Fetch models for each hub
        const models = {};
        for (const hub of joined) {
          const model = await getFanHubModel(hub.fanHubId);
          if (model) {
            models[hub.fanHubId] = transformModel(model, hub.fanHubId);
          }
        }
        setHubModels(models);
      } catch (error) {
        console.error('Error fetching pet data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const selectPet = (petKey) => {
    const model = hubModels[petKey];
    if (model) {
      setSelectedPet(petKey);
      sessionStorage.setItem('selectedPet', petKey);
      sessionStorage.setItem('selectedPetModel', JSON.stringify(model));
      // Trigger re-render of UserLayout
      window.dispatchEvent(new Event('storage'));
    }
  };

  const deselectPet = () => {
    setSelectedPet(null);
    sessionStorage.removeItem('selectedPet');
    sessionStorage.removeItem('selectedPetModel');
    window.dispatchEvent(new Event('storage'));
  };

  const handleCreateModel = async () => {
    if (!ownedHub || !creationForm.name.trim()) return;

    const spriteEntries = SUPPORTED_STATES.reduce((entries, state) => {
      const sprite = creationForm.sprites[state];
      if (sprite.file && sprite.totalFrames) {
        entries.push({ state, file: sprite.file, totalFrames: parseInt(sprite.totalFrames, 10) });
      }
      return entries;
    }, []);

    if (spriteEntries.length === 0) {
      alert('Please upload at least one sprite file and specify its frame count.');
      return;
    }

    setUploading(true);
    try {
      await uploadFanHubModel({
        fanHubId: ownedHub.fanHubId,
        name: creationForm.name.trim(),
        spriteEntries
      });

      const model = await getFanHubModel(ownedHub.fanHubId);
      if (model) {
        setHubModels(prev => ({
          ...prev,
          [ownedHub.fanHubId]: transformModel(model, ownedHub.fanHubId)
        }));
      }

      setCreationForm(buildDefaultForm());
      alert('Pet model created successfully!');
    } catch (error) {
      console.error('Error creating pet model:', error);
      alert('Failed to create pet model. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSpriteChange = (state, field, value) => {
    setCreationForm(prev => ({
      ...prev,
      sprites: {
        ...prev.sprites,
        [state]: {
          ...prev.sprites[state],
          [field]: value
        }
      }
    }));
  };

  const handleSpriteFileChange = (state, file) => {
    setCreationForm(prev => ({
      ...prev,
      sprites: {
        ...prev.sprites,
        [state]: {
          ...prev.sprites[state],
          file
        }
      }
    }));
  };

  if (loading) {
    return <div className="pet-selection-list">Loading pets...</div>;
  }

  const availablePets = Object.values(hubModels);

  return (
    <div className="pet-selection-list retro-custom-scroll">
      <h3>Select Your Virtual Pet</h3>

      <div className="pet-selection-layout">
        <div className="pet-selection-panel">
          {availablePets.length > 0 ? (
            <div className="pet-thumbnails">
              {availablePets.map((pet) => {
                const hub = joinedHubs.find(h => h.fanHubId === pet.fanHubId);
                return (
                  <div
                    key={pet.fanHubId}
                    className={`pet-thumbnail ${selectedPet === pet.fanHubId ? 'selected' : ''}`}
                    onClick={() => selectPet(pet.fanHubId)}
                  >
                    <p>{pet.name}</p>
                    <img
                      src={pet.sprites?.idle?.url || pet.thumbnail}
                      alt={pet.name}
                      style={{
                        width: `${pet.frameWidth * 0.2}px`,
                        height: `${pet.frameHeight * 0.2}px`,
                        objectFit: 'cover',
                        objectPosition: '0 0',
                        imageRendering: 'pixelated'
                      }}
                      onError={(e) => {
                        e.target.src = '/default-pet-thumbnail.png';
                      }}
                    />
                    <small style={{textAlign: 'left'}}>
                      Model from the <span style={{ color: hub?.themeColor || '#333' }}>"{hub?.hubName || 'Community'}"</span> community
                    </small>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className='no-pet-available'>No pet models available. Join a fan hub with a custom pet to get on now!</p>
          )}

          {selectedPet && (
            <button className="pet-deselect-btn" onClick={deselectPet}>Deselect Pet</button>
          )}
        </div>

        <div className="model-create-panel">
          <h3>Create Pet Model</h3>
          {!ownedHub && (
            <div className="panel-overlay">
              <div className="panel-overlay-message">
                You need a Fan hub to upload a model to.
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Pet Name:</label>
            <input
              type="text"
              value={creationForm.name}
              onChange={(e) => setCreationForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter pet name"
              disabled={!ownedHub}
            />
          </div>

          <div className="sprites-section">
            <h5>Upload sprite files and frame counts</h5>
            {SUPPORTED_STATES.map(state => (
              <div key={state} className="sprite-field">
                <div>
                  <label>{state.charAt(0).toUpperCase() + state.slice(1)} Sprite</label>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={!ownedHub}
                    onChange={(e) => handleSpriteFileChange(state, e.target.files?.[0] || null)}
                  />
                </div>
                <div>
                  <label>Frames</label>
                  <input
                    type="number"
                    min="1"
                    value={creationForm.sprites[state].totalFrames}
                    disabled={!ownedHub}
                    onChange={(e) => handleSpriteChange(state, 'totalFrames', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            className="create-model-btn"
            onClick={handleCreateModel}
            disabled={!ownedHub || uploading}
          >
            {uploading ? 'Creating...' : 'Create Model'}
          </button>
        </div>
      </div>
    </div>
  );
}
