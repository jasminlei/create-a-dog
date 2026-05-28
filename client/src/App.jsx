import { useState } from 'react'
import './App.css'
import { HOROSCOPES, MAX_TRAITS, TRAITS } from './constants'

function App() {
  const [name, setName] = useState('')
  const [selectedTraits, setSelectedTraits] = useState([TRAITS[0]])
  const [traitToAdd, setTraitToAdd] = useState('')
  const [horoscope, setHoroscope] = useState(HOROSCOPES[0])

  const [dog, setDog] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  function handleReset() {
    setDog(null)
    setError('')
    setIsLoading(false)
    setName('')
    setSelectedTraits([TRAITS[0]])
    setTraitToAdd('')
  }

  function addTrait(trait) {
    if (!trait) return
    setSelectedTraits((current) => {
      if (current.length >= MAX_TRAITS) return current
      if (current.includes(trait)) return current
      return [...current, trait]
    })
  }

  function removeTrait(trait) {
    setSelectedTraits((current) => current.filter((t) => t !== trait))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Please give your dog a name.')
      return
    }

    if (selectedTraits.length === 0) {
      setError('Please select at least one personality trait.')
      return
    }

    if (selectedTraits.length > MAX_TRAITS) {
      setError(`Please select at most ${MAX_TRAITS} personality traits.`)
      return
    }

    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/dog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          traits: selectedTraits,
          horoscope,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setDog(null)
        setError(data?.error || 'Failed to create dog.')
        return
      }

      setDog(data)
    } catch {
      setDog(null)
      setError('Network error. Is the server running?')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='app'>
      <header className='header'>
        <h1>
          Create a <span className='titleAccent'>dog</span>
        </h1>
        <p>Always wanted a dog? Now you can create one.</p>
      </header>

      {dog ? (
        <section className='result' aria-label='Your generated dog'>
          <div className='imageFrame'>
            <img className='dogImage' src={dog.imageUrl} alt={dog.name} />
          </div>

          <div className='details' aria-label='Dog details'>
            <div className='detailRow'>
              <span className='detailLabel'>Name:</span>
              <span className='detailValue'>{dog.name}</span>
            </div>

            <div className='detailRow'>
              <span className='detailLabel'>Personality traits:</span>
              <span className='detailValue'>
                {(Array.isArray(dog.traits) ? dog.traits : [dog.trait])
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>

            <div className='detailRow'>
              <span className='detailLabel'>Horoscope:</span>
              <span className='detailValue'>{dog.horoscope}</span>
            </div>
          </div>

          <button className='button' type='button' onClick={handleReset}>
            Create a new dog
          </button>
        </section>
      ) : (
        <section className='panel'>
          <form className='form' onSubmit={handleSubmit}>
            <div className='field'>
              <label className='label' htmlFor='dog-name'>
                Dog’s name
              </label>
              <input
                id='dog-name'
                className='input'
                type='text'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g. Muffin'
                maxLength={40}
                autoComplete='off'
              />
            </div>

            <div className='field'>
              <label className='label' htmlFor='dog-trait'>
                Personality trait
              </label>
              <div className='chips' aria-label='Selected traits'>
                {selectedTraits.map((t) => (
                  <button
                    key={t}
                    className='chip'
                    type='button'
                    onClick={() => removeTrait(t)}
                    aria-label={`Remove ${t}`}
                  >
                    {t}
                    <span className='chipX' aria-hidden='true'>
                      ×
                    </span>
                  </button>
                ))}
              </div>
              <select
                id='dog-trait'
                className='select'
                value={traitToAdd}
                onChange={(e) => {
                  const next = e.target.value
                  addTrait(next)
                  setTraitToAdd('')
                }}
                disabled={selectedTraits.length >= MAX_TRAITS}
              >
                <option value='' disabled>
                  {selectedTraits.length >= MAX_TRAITS
                    ? `Max ${MAX_TRAITS} traits selected`
                    : 'Add a trait…'}
                </option>
                {TRAITS.filter((t) => !selectedTraits.includes(t)).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className='field'>
              <label className='label' htmlFor='dog-horoscope'>
                Horoscope sign
              </label>
              <select
                id='dog-horoscope'
                className='select'
                value={horoscope}
                onChange={(e) => setHoroscope(e.target.value)}
              >
                {HOROSCOPES.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <button className='button' type='submit' disabled={isLoading}>
              {isLoading ? 'Creating…' : 'Create dog'}
            </button>
          </form>

          {error ? <p className='error'>{error}</p> : null}
        </section>
      )}
    </div>
  )
}

export default App
