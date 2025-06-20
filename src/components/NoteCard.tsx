
import React, { useState } from 'react';
import { Note, Comment } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { getCommentsForNote, saveComment } from '@/lib/storage';
import { Edit, Trash2, MessageCircle, History, Calendar, User } from 'lucide-react';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onViewHistory: (noteId: string) => void;
  showComments?: boolean;
}

const NoteCard: React.FC<NoteCardProps> = ({ 
  note, 
  onEdit, 
  onDelete, 
  onViewHistory,
  showComments = false 
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>(getCommentsForNote(note.id));
  const [showCommentsSection, setShowCommentsSection] = useState(false);
  const [newComment, setNewComment] = useState('');

  const canEdit = user?.role === 'Admin' || user?.id === note.authorId;
  const canDelete = user?.role === 'Admin' || user?.id === note.authorId;
  const canComment = showComments && user?.role !== 'Viewer';

  const handleAddComment = () => {
    if (!newComment.trim() || !user) return;

    const comment: Comment = {
      id: `comment_${Date.now()}`,
      noteId: note.id,
      authorId: user.id,
      authorName: user.name,
      content: newComment,
      createdAt: new Date()
    };

    saveComment(comment);
    setComments([...comments, comment]);
    setNewComment('');
    toast({
      title: "Comentário adicionado!",
      description: "Seu comentário foi salvo com sucesso.",
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMarkdownPreview = (content: string) => {
    // Conversão simples de markdown para HTML para visualização
    return content
      .replace(/^# (.*$)/gm, '<h1 class="text-lg font-bold mb-2">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-base font-semibold mb-2">$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br />');
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {note.title}
            </h3>
            <div className="flex flex-col space-y-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
              <div className="flex items-center">
                <User className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{note.authorName}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="text-xs">{formatDate(note.createdAt)}</span>
                </div>
                <Badge variant="secondary" className="text-xs ml-2">
                  {note.team}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex space-x-1 ml-2 flex-shrink-0">
            {canEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(note)}
                className="h-7 w-7 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Edit className="w-3 h-3 text-blue-600" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onViewHistory(note.id)}
              className="h-7 w-7 p-0 hover:bg-purple-50 dark:hover:bg-purple-900/20"
            >
              <History className="w-3 h-3 text-purple-600" />
            </Button>
            {canDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(note.id)}
                className="h-7 w-7 p-0 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-3 h-3 text-red-600" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div 
          className="prose prose-sm dark:prose-invert max-w-none mb-4 text-sm line-clamp-4"
          dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(note.content) }}
        />
        
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {note.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {showComments && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCommentsSection(!showCommentsSection)}
              className="mb-2 p-2 h-auto"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              <span className="text-sm">
                {comments.length} Comentário{comments.length !== 1 ? 's' : ''}
              </span>
            </Button>

            {showCommentsSection && (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {comment.authorName}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                      {comment.content}
                    </p>
                  </div>
                ))}

                {canComment && (
                  <div className="flex flex-col space-y-2">
                    <Textarea
                      placeholder="Adicionar comentário..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[60px] text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="bg-green-600 hover:bg-green-700 text-white self-end"
                    >
                      Enviar
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NoteCard;
