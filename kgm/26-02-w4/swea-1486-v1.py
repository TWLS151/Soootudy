def tower(start, temp, height, result,N,M):

    temp+=height[start]     # temp에 시작 높이를 저장
    if temp >=M:            # temp가 M 보다 크면 result에 저장 후 함수 종료
        result.append(temp)
    else:               
        for i in range(start+1,N):      #시작 위치의 다음 위치에서 N-1까지 중 아무 위치나 이동해서 다시 재귀함수 시작
            tower(i,temp,height,result,N,M)
            
T=int(input())
for tc in range(1,1+T):
    N,M = map(int,input().split())
    height=list(map(int,input().split()))

    temp=0                                  # 높이를 저장할 변수
    result=[]                               # 타워의 높이를 저장할 리스트
    for i in range(N):
        tower(i,temp,height,result,N,M)     # 시작 지점을 0~N-1까지 선택
    result.sort()

    print(f'#{tc} {result.pop(0)-M}')

